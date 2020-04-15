import asyncio
import time
import datetime
import peewee
from peewee import SqliteDatabase
from oracle.src.price_feeder.moc_price_engines import base_engines_names

#database = peewee_async.SqliteDatabase('db.sqlite')
database = peewee.SqliteDatabase('db.sqlite')

AllEngines = list(base_engines_names.values())


class Logger:
    def error(self, msg):
        print("msg> ", msg)


logger = Logger()


class BaseEntity(peewee.Model):
    class Meta:
        database = database


class DateEntity(BaseEntity):
    date = peewee.DateTimeField(default=datetime.datetime.now)


class FetchCheck(BaseEntity):
    date = peewee.ForeignKeyField(DateEntity, backref='fetchs')
    engine = peewee.CharField()
    text = peewee.CharField()
    success = peewee.BooleanField()
    dur = peewee.DoubleField()


async def saver(the_date, fetcher_klass):
    fetcher = fetcher_klass(logger)
    success = False
    try:
        start = time.time()
        msg, err = await fetcher.fetch()
        end = time.time()
        success = err in (None, "")
    except Exception as exc:
        try:
            msg = str(exc)
        except:
            msg = "error"
    check = FetchCheck(date=the_date, engine=fetcher.name, text=msg, success=success,
                       dur=end-start)
    return check


def save_all(results):
    for x in results:
        while True:
            try:
                x.save()
                break
            except:
                pass


async def tester():
    await loop.run_in_executor(None, lambda: database.connect())
    try:
        database.create_tables([FetchCheck, DateEntity])
    except Exception as e:
        print(repr(e))

    the_date = None
    while True:
        if not (the_date is None):
            #ms = the_date+datetime.timedelta(seconds=30) - datetime.datetime.now()
            ms = the_date + 30 - time.time()
            print("waiting: %0.02fs.." % ms)
            await asyncio.sleep(ms)
        the_date = time.time() #datetime.datetime.now()
        _date = DateEntity()
        _date.save()
        #await loop.run_in_executor(None, _date.save)
        tasks = [saver(_date, klass) for klass in AllEngines]
        results = await asyncio.gather(*tasks)
        print("pre-end")
        await loop.run_in_executor(None, save_all, results)
        print("ended!")

if __name__=="__main__":
    database = SqliteDatabase("db.sqlite")
    loop = asyncio.get_event_loop()
    loop.run_until_complete(tester())
