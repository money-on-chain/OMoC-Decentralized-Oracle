import asyncio
import json
import logging
from collections import deque

import aiohttp

from config import Config


#
# /usr/bin/curl -s -X POST --data-urlencode "payload=$PAYLOAD" "$URL"

class SlackQueue:
    def __init__(self):
        self.config = Config.Get()
        self.dq = deque()
        asyncio.create_task(self.run())
        self.slack_data = self.config.getSlackInfo()

    def push(self, data):
        self.dq.append(data)

    async def run(self):
        while True:
            if len(self.dq) == 0:
                await asyncio.sleep(13)
            else:
                data = self.dq.popleft()
                await self.sendMsg(data)

    @staticmethod
    def get_attachements(data):
        now = data["date"]
        attachments = []
        for new_or_old, alert_msg, alert_action_required in data["alerts"]:
            attachments.append({
                "title": ("NEW " if new_or_old else "OLD ") + " " + now.strftime("%c"),
                "color": "danger" if alert_action_required else "good",
                "fields": [{"title": "Alert", "value": alert_msg, "short": False}]
            })
        return attachments

    async def sendMsg(self, data):
        retry = 0
        while retry < 5:
            try:
                attachments = self.get_attachements(data)
                payload = json.dumps({
                    "channel": self.slack_data["channel"],
                    "icon_emoji": ":-1:",
                    "username": self.slack_data["user"],
                    "text": "MOC Monitor" + self.slack_data["title"],
                    "attachments": attachments
                })
                async with aiohttp.ClientSession() as session:
                    async with session.post(self.slack_data["url"], data=payload) as response:
                        data = await response.text()
                        logging.info("Response from slack", data)
                return
            except Exception as err:
                logging.warning("Slack send error: " + str(err))
                retry = retry + 1
        logging.error("Slack send failed: " + str(err))
