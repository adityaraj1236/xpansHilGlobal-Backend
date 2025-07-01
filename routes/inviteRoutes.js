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
    const baseActionLink = `https://www.xpanshilglobal.com/invite/handle?token=${token}`;
    
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
    const baseActionLink = `https://www.xpanshilglobal.com/invite/handle?token=${token}`;
    
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
// Route to handle the invitation response (Accept/Reject)
router.post('/respond', async (req, res) => {
  const { token, status } = req.body;

  try {
    const invite = await Invite.findOne({ token });

    if (!invite || invite.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired invitation.' });
    }

    const project = await Project.findById(invite.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found for invitation.' });
    }

    if (status === 'Accepted') {
      invite.status = 'Accepted';
      await invite.save();

      let user = await User.findOne({ email: invite.email });

      if (!user) {
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user = await User.create({
          name: invite.email.split('@')[0],
          email: invite.email,
          password: hashedPassword,
          organization: project.organization,
          role: invite.role
        });

        const roleTitle = getRoleTitle(invite.role);
        const loginInfo = `
          <p>Your account has been created as <strong>${roleTitle}</strong>.</p>
          <p>Login Email: ${user.email}</p>
          <p>Temporary Password: <strong>${tempPassword}</strong></p>
          <p>Login here: <a href="https://www.xpanshilglobal.com/login">Login</a></p>
        `;

        await sendEmail(user.email, `Your ${roleTitle} Account`, loginInfo);
      } else {
        // Existing user: optionally update role if different
        if (user.role !== invite.role) {
          user.role = invite.role;
          await user.save();
        }

        const notifyMsg = `
          <p>You have been assigned as <strong>${getRoleTitle(invite.role)}</strong> for the project <b>${project.name}</b>.</p>
          <p><a href="https://www.xpanshilglobal.com/login">Click here to login</a></p>
        `;
        await sendEmail(user.email, `${getRoleTitle(invite.role)} Invitation Accepted`, notifyMsg);
      }

      // ✅ Update the project based on the role
      const projectUserData = {
        email: user.email,
        name: user.name || user.email.split('@')[0],
        status: 'Accepted'
      };

      if (invite.role === 'projectmanager') {
        project.projectManager = projectUserData;
      } else if (invite.role === 'sitesupervisor') {
        project.siteSupervisor = projectUserData;
      } else if (invite.role === 'billingengineer') {
        project.billingEngineer = projectUserData;
      }

      await project.save();

      return res.json({
        message: `Invitation accepted. ${getRoleTitle(invite.role)} assigned to project.`,
        user
      });
    }

    // If Rejected
    invite.status = 'Rejected';
    await invite.save();
    return res.json({ message: 'Invitation rejected.' });

  } catch (error) {
    console.error('Error handling invitation response:', error);
    res.status(500).json({ message: 'Error handling invitation response', error: error.message });
  }
});

// Helper function to return proper role title
function getRoleTitle(role) {
  if (role === 'projectmanager') return 'Project Manager';
  if (role === 'sitesupervisor') return 'Site Supervisor';
  if (role === 'billingengineer') return 'Billing Engineer';
  return 'Team Member';
}


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