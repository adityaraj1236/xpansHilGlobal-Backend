const express = require('express');
const crypto = require('crypto');
const Invite = require('../models/Invite');
const sendEmail = require('../config/email');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const bcrypt = require("bcrypt");

// Route to invite a project manager (using route parameter for projectId)
router.post('/projects/:projectId/invite-manager', async (req, res) => {
  const { email } = req.body;
  const { projectId } = req.params;
  const role = 'projectmanager'; // Hardcoded role
  
  console.log(`💬 Received in /invite-manager => ${email} for project: ${projectId}`);
  
  // Validate required fields
  if (!email || !projectId) {
    return res.status(400).json({ message: 'Email and project ID are required' });
  }
  
  try {
    // First, find the project to get the organization ID
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const orgId = project.organization;
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Adjust the baseActionLink if not using HTTPS on localhost
    const baseActionLink = `http://localhost:5173/invite/handle?token=${token}`;
    
    // Create the invite entry
    const invite = new Invite({
      email,
      orgId,
      projectId,
      role, // Use the hardcoded role
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1-day expiration
    });

    await invite.save();
    
    // Email content
    const subject = 'Project Manager Invitation';
    const content = `
      You've been invited to join as a <strong>Project Manager</strong> for the project: ${project.name}.
      Click below to Accept or Reject.
    `;
    
    // Send the invitation email
    await sendEmail(email, subject, content, baseActionLink);
    
    res.json({ message: 'Invitation email sent!' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Error sending invitation', error: error.message });
  }
});

// Route to invite a site supervisor (using route parameter for projectId)
router.post('/projects/:projectId/invite-supervisor', async (req, res) => {
  const { email } = req.body;
  const { projectId } = req.params;
  const role = 'sitesupervisor'; // Hardcoded role
  
  console.log(`💬 Received in /invite-supervisor => ${email} for project: ${projectId}`);
  
  // Validate required fields
  if (!email || !projectId) {
    return res.status(400).json({ message: 'Email and project ID are required' });
  }
  
  try {
    // First, find the project to get the organization ID
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const orgId = project.organization;
    
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Adjust the baseActionLink if not using HTTPS on localhost
    const baseActionLink = `http://localhost:5173/invite/handle?token=${token}`;
    
    // Create the invite entry
    const invite = new Invite({
      email,
      orgId,
      projectId,
      role, // Use the hardcoded role
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1-day expiration
    });

    await invite.save();
    
    // Email content
    const subject = 'Site Supervisor Invitation';
    const content = `
      You've been invited to join as a <strong>Site Supervisor</strong> for the project: ${project.name}.
      Click below to Accept or Reject.
    `;
    
    // Send the invitation email
    await sendEmail(email, subject, content, baseActionLink);
    
    res.json({ message: 'Invitation email sent!' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Error sending invitation', error: error.message });
  }
});

// Route to handle the invitation response (Accept/Reject)
router.post('/respond', async (req, res) => {
  const { token, status } = req.body;

  try {
    // Find the invite by token
    const invite = await Invite.findOne({ token });

    // Check if invite exists and is not expired
    if (!invite || invite.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired invitation.' });
    }

    // Handle the response based on 'status'
    if (status === 'Accepted') {
      invite.status = 'Accepted';
      await invite.save();  // Save updated status in DB

      // Check if user already exists
      const existingUser = await User.findOne({ email: invite.email });
      let user;
      
      if (existingUser) {
        user = existingUser;
      } else {
        // Generate a random password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        
        //Hash the password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create the user with the appropriate role
        user = await User.create({
          name: invite.email.split('@')[0],
          email: invite.email,
          password: hashedPassword,
          organization: invite.orgId || '67f3ee4dc60475e81662a4c4', // need to fix this as organization id should be dynamic
          role: invite.role, // Use the role from the invitation
        });
        
        // Determine role title for the email
        const roleTitle = invite.role === 'projectmanager' ? 'Project Manager' : 'Site Supervisor';
        
        // Send login credentials via email
        const loginInfo = `
          <p>Your account has been created as <strong>${roleTitle}</strong>.</p>
          <p>Login Email: ${user.email}</p>
          <p>Temporary Password: <strong>${tempPassword}</strong></p>
          <p>Login here: <a href="http://localhost:5173/login">Login</a></p>
        `;
        
        await sendEmail(user.email, `Your ${roleTitle} Account`, loginInfo);
      }
      
      // Update the project with this user based on their role
      if (invite.projectId) {
        try {
          const project = await Project.findById(invite.projectId);
          
          if (project) {
            if (invite.role === 'projectmanager') {
              // Update the project manager details
              project.projectManager = {
                email: user.email,
                name: user.name || user.email.split('@')[0], // Use part of email as name if not available
                status: 'Accepted'
              };
            } else if (invite.role === 'sitesupervisor') {
              // Update the site supervisor
              project.siteSupervisor = {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                status: 'Accepted'
              };
            }
            
            await project.save();
            console.log(`Project ${project._id} updated with ${invite.role}: ${user.email}`);
          }
        } catch (error) {
          console.error(`Error updating project with ${invite.role}:`, error);
          // Continue with response even if project update fails
        }
      }

      return res.json({ 
        message: `Invitation accepted. Account created and project updated with ${invite.role}.` 
      });
    }

    invite.status = 'Rejected'; // If status is 'Rejected', set the status
    await invite.save();  // Save updated status in DB

    res.json({ message: 'Invitation rejected.' }); // Send rejection response
  } catch (error) {
    console.error('Error handling invitation response:', error);
    res.status(500).json({ message: 'Error handling invitation response', error: error.message });
  }
});

// Route to update user roles in a project
router.put('/projects/:projectId/users/:userId/role', async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  
  // Validate role
  if (role !== 'projectmanager' && role !== 'sitesupervisor') {
    return res.status(400).json({ message: 'Invalid role. Must be projectmanager or sitesupervisor' });
  }
  
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update user's role
    user.role = role;
    await user.save();
    
    // Update project based on the new role
    if (role === 'projectmanager') {
      // Remove user from site supervisor if they were one
      if (project.siteSupervisor && project.siteSupervisor.email === user.email) {
        project.siteSupervisor = null;
      }
      
      // Add as project manager
      project.projectManager = {
        email: user.email,
        name: user.name || user.email.split('@')[0],
        status: 'Accepted'
      };
    } else if (role === 'sitesupervisor') {
      // If user was the project manager, remove them
      if (project.projectManager && project.projectManager.email === user.email) {
        project.projectManager = null;
      }
      
      // Add as site supervisor
      project.siteSupervisor = {
        email: user.email,
        name: user.name || user.email.split('@')[0],
        status: 'Accepted'
      };
    }
    
    await project.save();
    
    res.json({ 
      message: `User role updated to ${role} and project updated successfully`,
      user,
      project 
    });
    
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

module.exports = router;