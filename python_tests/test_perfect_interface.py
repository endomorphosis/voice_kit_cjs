import unittest
from unittest.mock import AsyncMock

# Mocking the perfectInterface equivalent in Python
def perfect_interface():
    class MockPerfectInterface:
        def __init__(self):
            self.history = []

        async def send_message(self, message):
            if message == "":
                raise ValueError("Cannot send an empty message")
            response = f"Response to '{message}'"
            self.history.append({'sender': 'user', 'message': message})
            self.history.append({'sender': 'ai', 'message': response})
            return response

        def get_conversation_history(self):
            return self.history

        async def clear_conversation(self):
            self.history = []

    return MockPerfectInterface()

class TestPerfectInterface(unittest.TestCase):

    def setUp(self):
        self.interface = perfect_interface()

    async def test_send_message(self):
        response = await self.interface.send_message("Hello, AI!")
        self.assertIsNotNone(response)
        self.assertIsInstance(response, str)
        self.assertGreater(len(response), 0)

    async def test_conversation_history(self):
        first_response = await self.interface.send_message("Hello")
        await self.interface.send_message("How are you?")
        history = self.interface.get_conversation_history()
        self.assertEqual(len(history), 4)
        self.assertEqual(history[0]['sender'], "user")
        self.assertEqual(history[0]['message'], "Hello")
        self.assertEqual(history[1]['sender'], "ai")
        self.assertIsInstance(history[1]['message'], str)
        self.assertEqual(history[2]['sender'], "user")
        self.assertEqual(history[2]['message'], "How are you?")
        self.assertEqual(history[3]['sender'], "ai")
        self.assertIsInstance(history[3]['message'], str)

    async def test_reject_empty_message(self):
        with self.assertRaises(ValueError):
            await self.interface.send_message("")

    async def test_clear_conversation(self):
        await self.interface.send_message("Hello")
        history = self.interface.get_conversation_history()
        self.assertGreater(len(history), 0)
        await self.interface.clear_conversation()
        history = self.interface.get_conversation_history()
        self.assertEqual(len(history), 0)

# To run the tests, the following lines could be used if this script were standalone:
# if __name__ == '__main__':
#     unittest.main()