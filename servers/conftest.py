import logging

import pytest

logging.basicConfig(level=logging.INFO)


def pytest_configure(config):
    markexpr = getattr(config.option, 'markexpr')
    if 'exchanges' not in markexpr:
        setattr(config.option, 'markexpr', 'not exchanges' if not markexpr else '(%s) and not exchanges' % markexpr)
