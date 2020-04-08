from unittest.mock import patch

# client = TestClient(app)
from common.services import moc_service


# from .app import app

def side_effect(*args):
    print('---------------', (args), )
    return 4


@patch('common.services.moc_service.balance_of')
def test_read_main(rr):
    # rr.return_value = "123"
    # rr.side_effect = Exception('Boom!')
    rr.side_effect = side_effect
    assert moc_service.balance_of(12) == 4
    assert moc_service.balance_of.called
    assert rr.called

    # response = client.get("/")
    # assert response.status_code == 200
