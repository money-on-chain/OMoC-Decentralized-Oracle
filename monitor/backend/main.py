import logging

from app import app

# import uvicorn
# def run_uvicorn(app, port):
#     uvicorn.run(app, host="0.0.0.0",
#                 port=port,
#                 log_level=logging.INFO,
#                 reload=False)

if __name__ == "__main__":
    # run_uvicorn("app:app", 7777)
    app.logger.setLevel(logging.DEBUG)
    app.run()
