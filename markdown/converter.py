import pymmd
import os,re


files = ["index","step01", "step02", "step03"]
htmlpath = "./HTML/"

for file in files:
	htmlFile = htmlpath + file + ".html" 
	mmdFile = file + ".mmd"

	if os.path.exists(htmlpath + file): os.remove(htmlFile) 
	#generate html from mmdFile and return body content from HTML
	html_RAW = pymmd.convert_from(mmdFile)
	body = re.search(r'<body>.*</body>',html_RAW,re.DOTALL).group(0)[6:-7]
	html_RAW = re.sub(re.escape("</head>"),
					'	<link rel="stylesheet" type="text/css" href="style.css" media="screen"/> </head>',
					html_RAW)
	file = open(htmlFile,"w+") 
	file.write(html_RAW)
	file.close()