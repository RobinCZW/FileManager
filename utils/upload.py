# coding: utf-8
import os
import requests
import hashlib
import socket
import getopt
import re
import oss2
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def do_nothing(*args):
    return None
socket.gethostbyaddr = do_nothing
socket.gethostbyname = do_nothing
def output(text):
	sys.stdout.write(text)
class DBFSException(Exception):
	def __init__(self, code, info, res):
		self.code = code
		self.info = info
		self.res = res
	def __str__(self):
		return '[%d] %s %s' % (self.code, self.info, self.res)
class DBFS:
	def __init__(self, school, root, oss):
		#self.root = 'http://finalexam.cn/api'
		#self.root = 'http://localhost:8080/api'
		#self.root = 'http://10.144.186.96/api'
		self.root = root
		self.session = requests.session()
		self.school = str(school)
		self.dics = {}
		self.oss = oss
	def isExist(self, path):
		if path[-1] == '/': #folder
			patt = r'([^/]+)/$'
		else:
			patt = r'([^/]+)$'
		parent = re.sub(patt, '', path)
		base = re.search(patt, path).groups()[0]
		list = self.list(parent)
		if list is None:
			return False
		if path[-1] == '/': #folder
			return base in list['folders']
		else:
			return base in list['files']
	def send(self, url, data):
		ret = self.session.post(self.root+url, data = data)
		json = ret.json()
		if json['code'] == 0:
			return json['res']
		else:
			raise DBFSException(json['code'], json['info'], json['res'])
	def sendFile(self, url, data, files):
		ret = self.session.post(self.root+url, data = data, files = files)
		json = ret.json()
		if json['code'] == 0:
			return json['res']
		else:
			raise DBFSException(json['code'], json['info'], json['res'])
	def login(self, username, password):
		data = {
			'un': username,
			'pw': password
		}
		ret = self.send('/user/login', data)
		# print ret
	def mkdir(self, path):
		if self.isExist(path):
			output(' exist ')
			return True
		data = {
			'path': path
		}
		try:
			ret = self.send('/dbfs/%s/newFolder' % self.school, data)
			return True
		except Exception, e:
			return False
			#if e.code != 118: # 已存在则忽略
			#	raise e
	def list(self, path):
		data = {
			'path': path,
			'detail': '0'
		}
		if path in self.dics:
			return self.dics[path]
		try:
			ret = self.send('/dbfs/%s/list' % self.school, data)
			ret['files'] = map(lambda i: i['name'], ret['files'])
			ret['folders'] = map(lambda i: i['name'], ret['folders'])
			self.dics[path] = ret
			return ret
		except Exception, e:
			print e
			return None
	def link(self, path, md5):
		data = {
			'path': path,
			'hash': md5
		}
		try:
			self.send('/dbfs/%s/link' % self.school, data)
			return True
		except Exception, e:
			return False
	def upload(self, path, file):
		if self.isExist(path):
			output(' exist ')
			return True
		with open(file, 'rb') as f:
			fdata = f.read()
			if len(fdata) == 0:
				output(' (length is 0, skip)')
				return False
			md5 = hashlib.md5(fdata).hexdigest()
			if self.link(path, md5):
				return True
			else:
				try:
					output('to oss %s ' % md5)
					self.oss.uploadWithMd5(md5, fdata)
					#self.sendFile('/dbfs/%s/upload' % self.school, { 'path': path }, { 'file': fdata })
					return self.link(path, md5)
				except Exception, e:
					output('upload failed: %s ' % str(e))
					return False
class OSS:
	def __init__(self, key, secret, endpoint):
		auth = oss2.Auth(key, secret)
		self.bucket = oss2.Bucket(auth, endpoint, 'qmkl', enable_crc=False)
	def uploadWithMd5(self, md5, data):
		m1 = md5[:3]
		m2 = md5[3:]
		self.bucket.put_object('objects/%s/%s' % (m1, m2), data)
def getRelpath(root, path):
	path = path.replace(root, '').replace('\\', '/')
	path = ('/' + path + '/').replace('//', '/')
	return path
def usage():
	print 'usage:'
	print ''
if __name__ == '__main__':
	try:
		opts, args = getopt.getopt(sys.argv[1:], "k:s:", ["key=", "secret=", "school=", "skip", 'root=']) 
	except getopt.GetoptError, err:
		print str(err)
		usage()
		sys.exit(2)
	endpoint = 'http://oss-cn-qingdao-internal.aliyuncs.com'
	key = secret = school = skipCount = None
	root = None
	for o, val in opts:
		val = val.decode(sys.getfilesystemencoding())
		if o in ('-k', '--key'):
			key = val
		elif o in ('-s', '--secret'):
			secret = val
		elif o == '--school':
			school = val
		elif o in ('--skip'):
			skipCount = val
		elif o == '--root':
			root = val
	print 'root %s, school %s' % (root, school)
	if (key and secret and school and root) is None:
		print u'参数不足'
		exit(1)
	'''
	if raw_input(u'school: %s, root: %s, skip: %d, are you sure? (y/n) ' % (school, root, skipCount)) != 'y':
		print 'exit.'
		exit(0)
	'''
	oss = OSS(key, secret, endpoint)
	dbfs = DBFS(school, 'http://finalexam.cn/api', oss)
	dbfs.login(u'anonymous', u'anonymous')
	
	count = 0
	#dbfs.login('admin', 'admin')
	for path,dirs,files in os.walk(root):
		for dir in dirs:
			relpath = getRelpath(root, path) + dir + '/'
			output('mkdir ' + relpath)
			count += 1
			if count < skipCount:
				output(' skip\n')
				continue
			if dbfs.mkdir(relpath):
				output(' ok\n')
			else:
				output(' failed\n')
		for file in files:
			localpath = os.path.join(path, file)
			relpath = getRelpath(root, path) + file
			output('upload %s from %s' % (relpath, localpath))
			count += 1
			if count < skipCount:
				output(' skip\n')
				continue
			if dbfs.upload(relpath, localpath):
				output(' ok\n')
			else:
				output(' failed\n')
