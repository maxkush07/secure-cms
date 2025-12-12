const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Newsletter Model
 * Manages newsletter campaigns, subscribers, and email templates
 */

// Email Template Schema
const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Email content is required'],
    },
    htmlContent: {
      type: String,
      default: null,
    },
    variables: [
      {
        name: String,
        description: String,
        required: Boolean,
      },
    ],
    category: {
      type: String,
      enum: ['welcome', 'promotion', 'announcement', 'custom'],
      default: 'custom',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Subscriber Schema
const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'bounced', 'unsubscribed'],
      default: 'active',
    },
    subscriptionDate: {
      type: Date,
      default: Date.now,
    },
    unsubscribeDate: {
      type: Date,
      default: null,
    },
    unsubscribeToken: {
      type: String,
      default: null,
    },
    confirmationToken: {
      type: String,
      default: null,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    confirmationDate: {
      type: Date,
      default: null,
    },
    preferences: {
      promotions: {
        type: Boolean,
        default: true,
      },
      announcements: {
        type: Boolean,
        default: true,
      },
      weeklyDigest: {
        type: Boolean,
        default: false,
      },
      customCategories: [String],
    },
    metadata: {
      source: String,
      tags: [String],
      customFields: mongoose.Schema.Types.Mixed,
    },
    bounceCount: {
      type: Number,
      default: 0,
    },
    lastEngagementDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Newsletter Campaign Schema
const newsletterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Newsletter title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
    content: {
      subject: String,
      htmlBody: String,
      textBody: String,
      templateVariables: mongoose.Schema.Types.Mixed,
    },
    recipients: {
      type: String,
      enum: ['all', 'segment', 'custom'],
      default: 'all',
    },
    segmentFilter: {
      status: [String],
      preferences: mongoose.Schema.Types.Mixed,
      tags: [String],
      customFilter: String,
    },
    customRecipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscriber',
      },
    ],
    scheduledDate: {
      type: Date,
      default: null,
    },
    sentDate: {
      type: Date,
      default: null,
    },
    stats: {
      totalSent: {
        type: Number,
        default: 0,
      },
      delivered: {
        type: Number,
        default: 0,
      },
      bounced: {
        type: Number,
        default: 0,
      },
      opens: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      unsubscribes: {
        type: Number,
        default: 0,
      },
      spam: {
        type: Number,
        default: 0,
      },
    },
    openRate: {
      type: Number,
      default: 0,
    },
    clickRate: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [String],
    retryCount: {
      type: Number,
      default: 0,
      max: [3, 'Maximum retry count is 3'],
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Subscriber Activity Schema
const subscriberActivitySchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscriber',
      required: true,
    },
    newsletter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Newsletter',
      required: true,
    },
    activityType: {
      type: String,
      enum: ['sent', 'delivered', 'bounced', 'opened', 'clicked', 'unsubscribed', 'spam'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      linkUrl: String,
      bounceType: String,
      bounceSubType: String,
    },
  },
  { timestamps: false }
);

// Indexes for performance
emailTemplateSchema.index({ isActive: 1, category: 1 });
subscriberSchema.index({ email: 1, status: 1 });
subscriberSchema.index({ createdAt: -1 });
subscriberSchema.index({ 'preferences.promotions': 1, 'preferences.announcements': 1 });
newsletterSchema.index({ status: 1, createdAt: -1 });
newsletterSchema.index({ template: 1 });
subscriberActivitySchema.index({ subscriber: 1, newsletter: 1 });
subscriberActivitySchema.index({ activityType: 1, timestamp: -1 });

// Instance Methods
subscriberSchema.methods.generateUnsubscribeToken = function () {
  this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  return this.unsubscribeToken;
};

subscriberSchema.methods.generateConfirmationToken = function () {
  this.confirmationToken = crypto.randomBytes(32).toString('hex');
  return this.confirmationToken;
};

subscriberSchema.methods.confirmSubscription = function () {
  this.isConfirmed = true;
  this.confirmationDate = new Date();
  this.confirmationToken = null;
};

subscriberSchema.methods.unsubscribe = function () {
  this.status = 'unsubscribed';
  this.unsubscribeDate = new Date();
};

subscriberSchema.methods.reactivate = function () {
  this.status = 'active';
  this.unsubscribeDate = null;
};

subscriberSchema.methods.updateEngagement = function () {
  this.lastEngagementDate = new Date();
  return this.save();
};

// Static Methods
subscriberSchema.statics.findActiveSubscribers = function (filter = {}) {
  return this.find({
    status: 'active',
    isConfirmed: true,
    ...filter,
  });
};

subscriberSchema.statics.findBySegment = function (segmentFilter) {
  const query = { status: 'active', isConfirmed: true };

  if (segmentFilter.tags && segmentFilter.tags.length > 0) {
    query['metadata.tags'] = { $in: segmentFilter.tags };
  }

  if (segmentFilter.preferences) {
    Object.keys(segmentFilter.preferences).forEach((key) => {
      query[`preferences.${key}`] = segmentFilter.preferences[key];
    });
  }

  return this.find(query);
};

newsletterSchema.methods.calculateStats = function () {
  if (this.stats.totalSent === 0) return;

  this.openRate = (this.stats.opens / this.stats.totalSent) * 100;
  this.clickRate = (this.stats.clicks / this.stats.totalSent) * 100;
  this.bounceRate = (this.stats.bounced / this.stats.totalSent) * 100;
};

newsletterSchema.methods.canBeSent = function () {
  return this.status === 'draft' || this.status === 'failed';
};

newsletterSchema.methods.updateStatus = function (newStatus, failureReason = null) {
  this.status = newStatus;
  if (newStatus === 'sent') {
    this.sentDate = new Date();
  }
  if (failureReason) {
    this.failureReason = failureReason;
  }
  return this.save();
};

// Model Creation
const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Newsletter = mongoose.model('Newsletter', newsletterSchema);
const SubscriberActivity = mongoose.model('SubscriberActivity', subscriberActivitySchema);

module.exports = {
  EmailTemplate,
  Subscriber,
  Newsletter,
  SubscriberActivity,
};