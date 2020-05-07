FROM python:3.7

RUN apt-get update && \
    apt-get install -y \
        locales

RUN echo $TZ > /etc/timezone && \
    apt-get update && apt-get install -y tzdata && \
    rm /etc/localtime && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get clean

COPY ./files/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir /common
COPY ./files/common /common
RUN mkdir /oracle
COPY ./files/oracle /oracle
RUN mkdir /contracts
COPY ./files/contracts /contracts
COPY ./files/dotenv /.env
COPY ./files/run.sh /

WORKDIR /
ENV PATH "$PATH:/"
ENV PYTHONPATH "${PYTONPATH}:/"
CMD ["/run.sh"]
