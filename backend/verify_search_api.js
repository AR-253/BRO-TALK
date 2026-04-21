const axios = require('axios');

const testSearch = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/posts/search?q=islamic');
        console.log('Search Results Keys:', Object.keys(response.data));
        console.log('Topics Found:', response.data.topics?.length || 0);
        if (response.data.topics && response.data.topics.length > 0) {
            console.log('First Topic:', response.data.topics[0].title);
        }
    } catch (error) {
        console.error('Search Test Failed:', error.message);
    }
};

testSearch();
