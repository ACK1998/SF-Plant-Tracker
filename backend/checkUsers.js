const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const users = await User.find({}).select('_id username email role isActive createdAt');
    console.log('\n=== USERS IN DATABASE ===');
    console.log('Total users:', users.length);
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // Check if the specific user ID exists
    const specificUser = await User.findById('68973b38780926e491302733');
    console.log('=== SPECIFIC USER CHECK ===');
    console.log('User 68973b38780926e491302733 exists:', specificUser ? 'YES' : 'NO');
    if (specificUser) {
      console.log('User details:', {
        username: specificUser.username,
        email: specificUser.email,
        role: specificUser.role,
        isActive: specificUser.isActive
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
