param([switch]$SkipDeploy)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$savedStash = $null

function Run-Git {
    param([string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Git 操作失败：git $($Arguments -join ' ')" }
}

function Run-Npm {
    param([string[]]$Arguments)
    & npm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) { throw "检查或发布失败：npm $($Arguments -join ' ')" }
}

try {
    foreach ($tool in @('git', 'node', 'npm.cmd')) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "找不到 $tool，请先安装 Git 和 Node.js 22 或更新版本。"
        }
    }
    $branch = & git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
        throw '请在 main 分支运行此脚本。未修改当前分支。'
    }
    $remote = & git remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^(https://github\.com/Benjamin-ping/clashparty\.online(?:\.git)?|git@github\.com:Benjamin-ping/clashparty\.online(?:\.git)?)$') {
        throw 'origin 不是本站 GitHub 仓库，请先检查仓库地址。'
    }
    foreach ($state in @('MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD')) {
        $statePath = & git rev-parse --git-path $state
        if (Test-Path -LiteralPath $statePath) { throw '有尚未完成的合并或变基，请先处理后再运行。' }
    }

    Write-Host "`n[1/5] 同步 GitHub 最新代码……" -ForegroundColor Cyan
    # Fetch first, so a network/authentication failure leaves local edits untouched.
    Run-Git -Arguments @('fetch', 'origin', 'main')
    $changes = & git status --porcelain
    if ($LASTEXITCODE -ne 0) { throw '无法读取本地修改。' }
    if ($changes) {
        Write-Host '暂存本地修改（包括未跟踪文件），同步后自动恢复。'
        Run-Git -Arguments @('stash', 'push', '--include-untracked', '-m', ('upload-script-' + (Get-Date -Format 'yyyyMMdd-HHmmss')))
        $savedStash = (& git rev-parse 'stash@{0}').Trim()
        if ($LASTEXITCODE -ne 0) { throw '无法确认本地修改的暂存记录。' }
    }
    Run-Git -Arguments @('rebase', 'origin/main')
    if ($savedStash) {
        Run-Git -Arguments @('stash', 'apply', '--index', $savedStash)
        # Remove only this script's stash, after successful restoration.
        $stashRows = & git stash list '--format=%H %gd'
        if ($LASTEXITCODE -ne 0) { throw '无法读取暂存记录，本地修改已恢复。' }
        foreach ($row in $stashRows) {
            $parts = $row -split ' ', 2
            if ($parts[0] -eq $savedStash) {
                Run-Git -Arguments @('stash', 'drop', $parts[1])
                break
            }
        }
        $savedStash = $null
    }

    Write-Host "`n[2/5] 安装依赖并检查网站……" -ForegroundColor Cyan
    Run-Npm -Arguments @('ci')
    Run-Npm -Arguments @('test')
    Run-Npm -Arguments @('run', 'build')
    Run-Npm -Arguments @('run', 'check')

    Write-Host "`n[3/5] 提交本地修改……" -ForegroundColor Cyan
    Run-Git -Arguments @('add', '--all')
    & git diff --cached --quiet
    $diffResult = $LASTEXITCODE
    if ($diffResult -eq 1) {
        Run-Git -Arguments @('commit', '-m', ('Update website ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
    } elseif ($diffResult -eq 0) {
        Write-Host '没有新的文件修改，跳过提交。'
    } else {
        throw '无法检查待提交的修改。'
    }

    Write-Host "`n[4/5] 上传到 GitHub……" -ForegroundColor Cyan
    Run-Git -Arguments @('push', 'origin', 'main')

    if (-not $SkipDeploy) {
        Write-Host "`n[5/5] 发布到 clashparty.online……" -ForegroundColor Cyan
        & npx.cmd --no-install wrangler deploy
        if ($LASTEXITCODE -ne 0) { throw 'GitHub 已上传，但网站发布失败。请查看上方错误；处理后可重新运行。' }
    }
    Write-Host "`n完成！GitHub 已更新。" -ForegroundColor Green
    if (-not $SkipDeploy) { Write-Host '网站已发布：https://clashparty.online/' -ForegroundColor Green }
    exit 0
} catch {
    Write-Host "`n已停止：$($_.Exception.Message)" -ForegroundColor Red
    if ($savedStash) {
        Write-Host "本地修改的备份仍保存在 Git stash，记录：$savedStash" -ForegroundColor Yellow
        Write-Host '如果出现冲突，请先处理冲突。不要反复应用 stash，也不要删除备份。' -ForegroundColor Yellow
    }
    Write-Host '请保留上方错误信息，处理后再运行。脚本不会强制推送或覆盖远程代码。' -ForegroundColor Yellow
    exit 1
}
