import requests
import json
import uuid
from datetime import datetime

class PastryShopAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_order_id = None
        self.created_review_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except json.JSONDecodeError:
                        return success, response.text
                return success, None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_get_flavors(self):
        """Test GET /api/flavors endpoint"""
        success, response = self.run_test(
            "GET /api/flavors - Get all flavors",
            "GET",
            "api/flavors",
            200
        )
        
        if success:
            # Verify we have 10 Brazilian pastry flavors
            if len(response) == 10:
                print(f"✅ Verified 10 flavors returned")
                # Print the first 3 flavors as a sample
                print("Sample flavors:")
                for flavor in response[:3]:
                    print(f"  - {flavor['name']}: {flavor['description']} (R$ {flavor['price']})")
            else:
                print(f"❌ Expected 10 flavors, got {len(response)}")
                success = False
        
        return success, response

    def test_create_order(self):
        """Test POST /api/orders endpoint"""
        # Create a test order
        order_data = {
            "customer_name": f"Test Customer {uuid.uuid4().hex[:8]}",
            "customer_phone": "123-456-7890",
            "items": [
                {
                    "flavor_name": "Misto",
                    "quantity": 2,
                    "price": 8.0
                },
                {
                    "flavor_name": "Calabresa",
                    "quantity": 1,
                    "price": 9.0
                }
            ],
            "total_amount": 25.0,
            "notes": "Test order created by automated testing"
        }
        
        success, response = self.run_test(
            "POST /api/orders - Create new order",
            "POST",
            "api/orders",
            200,
            data=order_data
        )
        
        if success and response and 'id' in response:
            self.created_order_id = response['id']
            print(f"✅ Order created with ID: {self.created_order_id}")
            print(f"✅ Order status: {response['status']}")
            print(f"✅ Order total: R$ {response['total_amount']}")
        
        return success, response

    def test_get_orders(self):
        """Test GET /api/orders endpoint"""
        success, response = self.run_test(
            "GET /api/orders - Get all orders",
            "GET",
            "api/orders",
            200
        )
        
        if success:
            if len(response) > 0:
                print(f"✅ Found {len(response)} orders")
                # Check if our created order is in the list
                if self.created_order_id:
                    found = any(order['id'] == self.created_order_id for order in response)
                    if found:
                        print(f"✅ Found our created order in the list")
                    else:
                        print(f"❌ Our created order was not found in the list")
            else:
                print("⚠️ No orders found, but endpoint works")
        
        return success, response

    def test_update_order_status(self):
        """Test PUT /api/orders/{order_id} endpoint"""
        if not self.created_order_id:
            print("❌ Cannot test order update - no order was created")
            return False, None
        
        # Update order status to "Preparando"
        update_data = {
            "status": "Preparando"
        }
        
        success, response = self.run_test(
            f"PUT /api/orders/{self.created_order_id} - Update order status",
            "PUT",
            f"api/orders/{self.created_order_id}",
            200,
            data=update_data
        )
        
        if success:
            if response['status'] == "Preparando":
                print(f"✅ Order status updated to: {response['status']}")
            else:
                print(f"❌ Order status not updated correctly. Expected 'Preparando', got '{response['status']}'")
                success = False
        
        return success, response

    def test_create_review(self):
        """Test POST /api/reviews endpoint"""
        review_data = {
            "customer_name": f"Test Reviewer {uuid.uuid4().hex[:8]}",
            "rating": 5,
            "comment": "Excelentes pastéis! Os melhores da cidade!"
        }
        
        success, response = self.run_test(
            "POST /api/reviews - Create new review",
            "POST",
            "api/reviews",
            200,
            data=review_data
        )
        
        if success and response and 'id' in response:
            self.created_review_id = response['id']
            print(f"✅ Review created with ID: {self.created_review_id}")
            print(f"✅ Review rating: {response['rating']}/5")
        
        return success, response

    def test_get_reviews(self):
        """Test GET /api/reviews endpoint"""
        success, response = self.run_test(
            "GET /api/reviews - Get all reviews",
            "GET",
            "api/reviews",
            200
        )
        
        if success:
            if len(response) > 0:
                print(f"✅ Found {len(response)} reviews")
                # Check if our created review is in the list
                if self.created_review_id:
                    found = any(review['id'] == self.created_review_id for review in response)
                    if found:
                        print(f"✅ Found our created review in the list")
                    else:
                        print(f"❌ Our created review was not found in the list")
            else:
                print("⚠️ No reviews found, but endpoint works")
        
        return success, response

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 50)
        print("🧪 STARTING PASTRY SHOP API TESTS")
        print("=" * 50)
        
        # Test flavors endpoint
        self.test_get_flavors()
        
        # Test orders endpoints
        self.test_create_order()
        self.test_get_orders()
        self.test_update_order_status()
        
        # Test reviews endpoints
        self.test_create_review()
        self.test_get_reviews()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 SUMMARY: {self.tests_passed}/{self.tests_run} tests passed")
        print("=" * 50)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    # Get the backend URL from the frontend .env file
    backend_url = "https://1bfd4f16-96d0-4605-85db-a48133efc6b1.preview.emergentagent.com"
    
    # Run the tests
    tester = PastryShopAPITester(backend_url)
    tester.run_all_tests()