try {
    console.log('Checking express...');
    require('express');
    console.log('Checking dotenv...');
    require('dotenv');
    console.log('Checking cors...');
    require('cors');
    console.log('Checking mongoose...');
    require('mongoose');
    console.log('Checking bcryptjs...');
    require('bcryptjs');
    console.log('Checking jsonwebtoken...');
    require('jsonwebtoken');
    console.log('Checking express-async-handler...');
    require('express-async-handler');
    console.log('All modules loaded successfully.');
} catch (error) {
    console.error('Failed to load module:', error.message);
}
