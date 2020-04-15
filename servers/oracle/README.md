Oracle provider implementation

Configuration (default name: o1.json):

````json
{
  "address": "0xB65e413Cd1b7b177Ebd38c8E850EeCD64630768C",
  "port": 8000,
  "privatekey": "b3aa5b1e29c4a2ecd7563b50ab8483837d9c3622474227b81c7764b13eec2939",
  "keyfile": "path-to-filekey",
  "ip": "127.0.0.1"
}
````

Where `privatekey` and `privatekey` are ways to define oracle key and only one is necessary. 


Invoke with:
````
uvicorn run:app
````
or:
````
python run.py
````

Especify other configuration file with one of these:
````
CFG=mycfg.json uvicorn run:app
CFG=my_config.json python run.py
````

## To do

1. make publish message support fallback address
2. read blocks for new published price
3. ~~sign endpoint~~
4. configure oracle server port from its config file
5. review block incoming function for busyloops
6. check price checker functions

