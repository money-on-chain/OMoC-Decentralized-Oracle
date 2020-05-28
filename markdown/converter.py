import pymmd
import os,re

template = "template.html"
files = ["index","step01", "step02", "step03"]
htmlpath = "./HTML/"

file = open(template,mode='r')
templateContent = file.read()
file.close()
for file in files:
	htmlFile = htmlpath + file + ".html" 
	mmdFile = file + ".mmd"

	if os.path.exists(htmlpath + file): os.remove(htmlFile) 
	#generate html from mmdFile and return body content from HTML
	print (mmdFile)
	html_RAW = pymmd.convert_from(mmdFile)
	body = re.search(r'<body>.*</body>',html_RAW,re.DOTALL).group(0)[6:-7]
	body = re.sub(r'<img',r'<br /> <img class="img-fluid"',body)
	if file=="index":
		templateIndex = re.sub(r'<a href="index.*</a>',r'',templateContent,re.DOTALL) if file=="index" else body
		html = re.sub("ID_CONTENIDO",body,templateIndex)
	else:
		html = re.sub("ID_CONTENIDO",body,templateContent)

	file = open(htmlFile,"w+") 
	file.write(html)
	file.close()