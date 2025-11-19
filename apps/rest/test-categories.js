// Test script for category endpoints
// Run this after setting up your authentication token

const BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your_clerk_token_here'; // Replace with actual token

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testCategories() {
    try {
        console.log('Testing Categories API...\n');

        // Test 1: Get all categories
        console.log('1. Getting all categories...');
        const getResponse = await fetch(`${BASE_URL}/categories`, {
            headers
        });
        const categories = await getResponse.json();
        console.log('Categories:', categories);

        // Test 2: Create a new category
        console.log('\n2. Creating a new category...');
        const createResponse = await fetch(`${BASE_URL}/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Electronics',
                description: 'Electronic devices and accessories'
            })
        });
        const newCategory = await createResponse.json();
        console.log('Created category:', newCategory);

        // Test 3: Update the category
        if (newCategory.id) {
            console.log('\n3. Updating the category...');
            const updateResponse = await fetch(`${BASE_URL}/categories/${newCategory.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: 'Electronics & Gadgets',
                    description: 'Electronic devices, gadgets and accessories'
                })
            });
            const updatedCategory = await updateResponse.json();
            console.log('Updated category:', updatedCategory);
        }

        // Test 4: Get categories again to see changes
        console.log('\n4. Getting all categories after updates...');
        const finalGetResponse = await fetch(`${BASE_URL}/categories`, {
            headers
        });
        const finalCategories = await finalGetResponse.json();
        console.log('Final categories:', finalCategories);

        console.log('\nCategory tests completed!');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Uncomment the line below and add your auth token to run the tests
// testCategories();