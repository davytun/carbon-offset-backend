require('dotenv').config();
const HederaService = require('./src/services/hederaService');
const connectDB = require('./src/config/db');
const Project = require('./src/models/Project');
const logger = require('./src/utils/logger');

async function setupBlockchain() {
  try {
    console.log('🚀 Starting Carbon Offset Tracker blockchain setup...\n');

    // Connect to database
    await connectDB();

    // Create HCS Topic for emissions logging
    console.log('📝 Creating Hedera Consensus Service topic...');
    const topicId = await HederaService.createTopic('Carbon Emissions Logging Topic');
    console.log(`✅ Topic created successfully: ${topicId}`);
    console.log(`   Add this to your .env file: HCS_TOPIC_ID=${topicId}\n`);

    // Create Carbon Offset Token
    console.log('🪙 Creating Carbon Offset Token...');
    const tokenId = await HederaService.createToken(
      'Carbon Offset Token',
      'CO2O',
      0, // No decimals (whole tokens only)
      0  // No initial supply
    );
    console.log(`✅ Token created successfully: ${tokenId}`);
    console.log(`   Add this to your .env file: OFFSET_TOKEN_ID=${tokenId}\n`);

    // Create sample projects
    console.log('🌱 Creating sample carbon offset projects...');
    
    const sampleProjects = [
      {
        projectId: 'FOREST_001',
        name: 'Amazon Rainforest Conservation',
        description: 'Protecting 10,000 hectares of Amazon rainforest from deforestation',
        location: 'Brazil',
        projectType: 'reforestation',
        costPerKg: 0.15, // HBAR per kg CO2e
        treasuryAccount: process.env.HEDERA_OPERATOR_ID,
        totalCapacity: 1000000,
        availableCredits: 1000000,
        verificationStandard: 'VCS',
        images: ['https://example.com/forest1.jpg'],
        certificationUrl: 'https://example.com/cert1.pdf'
      },
      {
        projectId: 'SOLAR_001',
        name: 'Solar Farm India',
        description: '50MW solar power plant replacing coal-based electricity',
        location: 'Rajasthan, India',
        projectType: 'renewable_energy',
        costPerKg: 0.12,
        treasuryAccount: process.env.HEDERA_OPERATOR_ID,
        totalCapacity: 500000,
        availableCredits: 500000,
        verificationStandard: 'Gold_Standard',
        images: ['https://example.com/solar1.jpg'],
        certificationUrl: 'https://example.com/cert2.pdf'
      },
      {
        projectId: 'METHANE_001',
        name: 'Landfill Methane Capture',
        description: 'Capturing methane emissions from municipal landfill',
        location: 'California, USA',
        projectType: 'methane_capture',
        costPerKg: 0.20,
        treasuryAccount: process.env.HEDERA_OPERATOR_ID,
        totalCapacity: 250000,
        availableCredits: 250000,
        verificationStandard: 'CAR',
        images: ['https://example.com/methane1.jpg'],
        certificationUrl: 'https://example.com/cert3.pdf'
      }
    ];

    for (const projectData of sampleProjects) {
      const existingProject = await Project.findOne({ projectId: projectData.projectId });
      if (!existingProject) {
        const project = new Project(projectData);
        await project.save();
        console.log(`   ✅ Created project: ${projectData.name}`);
      } else {
        console.log(`   ⚠️  Project already exists: ${projectData.name}`);
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Add the following to your .env file:');
    console.log(`   HCS_TOPIC_ID=${topicId}`);
    console.log(`   OFFSET_TOKEN_ID=${tokenId}`);
    console.log('2. Start the server with: npm start');
    console.log('3. Test the API endpoints with your frontend or Postman');
    
    console.log('\n🔗 Useful links:');
    console.log(`   Topic Explorer: https://hashscan.io/testnet/topic/${topicId}`);
    console.log(`   Token Explorer: https://hashscan.io/testnet/token/${tokenId}`);
    console.log(`   Account Explorer: https://hashscan.io/testnet/account/${process.env.HEDERA_OPERATOR_ID}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupBlockchain();
}

module.exports = setupBlockchain;