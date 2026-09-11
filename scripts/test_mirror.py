import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock

spec=importlib.util.spec_from_file_location('mirror',Path(__file__).with_name('sync-mirror.py'))
mirror=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mirror)

class MirrorTests(unittest.TestCase):
    def test_only_new_stable_or_unfinished_setup_needs_sync(self):
        state={'baseUrl':'https://download.example.com','version':'2.0.2','target':mirror.hashlib.sha256(b'bucket').hexdigest()}
        self.assertFalse(mirror.needs_sync(state,'2.0.2',state['baseUrl'],'bucket'))
        self.assertTrue(mirror.needs_sync(state,'2.0.3',state['baseUrl'],'bucket'))
        self.assertTrue(mirror.needs_sync({},'2.0.2',state['baseUrl'],'bucket'))
        self.assertTrue(mirror.needs_sync(state,'2.0.2',state['baseUrl'],'new-bucket'))
    def test_select_stable_not_prerelease(self):
        asset={'name':'clash-party-test.exe','url':'https://github.com/mihomo-party-org/clash-party/releases/download/v2.0.2/test.exe'}
        stable={'tag':'v2.0.2','date':'2026-08-14','prerelease':False,'assets':[asset]}
        newer={**stable,'prerelease':True,'date':'2026-09-01'}
        self.assertEqual(mirror.plan([newer,stable])[0],stable)

    def test_verification_failure_does_not_publish(self):
        client=Mock()
        with self.assertRaises(ValueError):
            mirror.publish(client,'bucket',{'assets':[{'key':'x'}]},Mock(side_effect=ValueError('bad hash')))
        client.put_object.assert_not_called()
        client.delete_object.assert_not_called()

    def test_publish_only_after_all_checks(self):
        client=Mock(); verify=Mock()
        manifest={'assets':[{'key':'a'},{'key':'b'}]}
        mirror.publish(client,'bucket',manifest,verify)
        self.assertEqual(verify.call_count,2)
        self.assertEqual(client.put_object.call_args.kwargs['Key'],mirror.PREFIX+'latest.json')

    def test_cleanup_scoped_and_keeps_current(self):
        client=Mock()
        client.get_paginator.return_value.paginate.return_value=[{'Contents':[{'Key':mirror.PREFIX+'old'},{'Key':mirror.PREFIX+'new'},{'Key':'unrelated/file'}]}]
        mirror.cleanup(client,'bucket',{mirror.PREFIX+'new'})
        client.delete_object.assert_called_once_with(Bucket='bucket',Key=mirror.PREFIX+'old')

if __name__=='__main__': unittest.main()
