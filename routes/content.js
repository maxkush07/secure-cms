const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { authenticate, authorize } = require('../middleware/auth');
const { validateContent, validateContentUpdate } = require('../middleware/validation');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../utils/errorHandler');

/**
 * @route   GET /api/content
 * @desc    Get all content with pagination, filtering, and sorting
 * @access  Public (but can be restricted based on content status)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} status - Filter by status (draft, published, archived)
 * @query   {string} author - Filter by author ID
 * @query   {string} sortBy - Sort field (createdAt, updatedAt, title)
 * @query   {string} order - Sort order (asc, desc)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, author, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Only show published content to unauthenticated users
    if (!req.user) {
      filter.status = 'published';
    } else if (!req.user.isAdmin) {
      // Non-admin users can only see published or their own content
      filter.$or = [
        { status: 'published' },
        { author: req.user.id }
      ];
    }

    // Build sort object
    const sortObj = {};
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'views'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortObj[sortField] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const content = await Content.find(filter)
      .populate('author', 'name email')
      .populate('category', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Content.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

/**
 * @route   GET /api/content/:id
 * @desc    Get single content by ID
 * @access  Public (for published), Private (for draft/archived)
 * @params  {string} id - Content ID
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id)
      .populate('author', 'name email')
      .populate('category', 'name')
      .populate('comments');

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Authorization check
    if (content.status !== 'published' && (!req.user || (req.user.id !== content.author._id.toString() && !req.user.isAdmin))) {
      throw new AppError('You are not authorized to view this content', 403);
    }

    // Increment view count for published content
    if (content.status === 'published') {
      content.views = (content.views || 0) + 1;
      await content.save();
    }

    res.status(200).json({
      success: true,
      data: content
    });
  })
);

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Private (authenticated users)
 * @body    {string} title - Content title (required)
 * @body    {string} content - Content body (required)
 * @body    {string} category - Category ID
 * @body    {string[]} tags - Array of tags
 * @body    {string} excerpt - Short excerpt
 * @body    {string} status - Status (draft, published) - default: draft
 */
router.post(
  '/',
  authenticate,
  validateContent,
  asyncHandler(async (req, res) => {
    const { title, content, category, tags, excerpt, status = 'draft' } = req.body;

    // Ensure status is either draft or published
    if (!['draft', 'published'].includes(status)) {
      throw new AppError('Invalid status. Must be draft or published', 400);
    }

    const newContent = await Content.create({
      title,
      content,
      category,
      tags: tags || [],
      excerpt,
      status,
      author: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const populatedContent = await newContent
      .populate('author', 'name email')
      .populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: populatedContent
    });
  })
);

/**
 * @route   PUT /api/content/:id
 * @desc    Update entire content
 * @access  Private (author or admin)
 * @params  {string} id - Content ID
 * @body    {string} title - Content title
 * @body    {string} content - Content body
 * @body    {string} category - Category ID
 * @body    {string[]} tags - Array of tags
 * @body    {string} excerpt - Short excerpt
 */
router.put(
  '/:id',
  authenticate,
  validateContentUpdate,
  asyncHandler(async (req, res) => {
    let content = await Content.findById(req.params.id);

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Authorization check - only author or admin can update
    if (req.user.id !== content.author.toString() && !req.user.isAdmin) {
      throw new AppError('You are not authorized to update this content', 403);
    }

    // Update only provided fields
    const allowedFields = ['title', 'content', 'category', 'tags', 'excerpt'];
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        content[key] = req.body[key];
      }
    });

    content.updatedAt = new Date();
    await content.save();

    const updatedContent = await content
      .populate('author', 'name email')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: updatedContent
    });
  })
);

/**
 * @route   PATCH /api/content/:id/publish
 * @desc    Publish content (change status from draft to published)
 * @access  Private (author or admin)
 * @params  {string} id - Content ID
 */
router.patch(
  '/:id/publish',
  authenticate,
  asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Authorization check - only author or admin can publish
    if (req.user.id !== content.author.toString() && !req.user.isAdmin) {
      throw new AppError('You are not authorized to publish this content', 403);
    }

    // Can only publish draft content
    if (content.status === 'published') {
      throw new AppError('Content is already published', 400);
    }

    if (content.status === 'archived') {
      throw new AppError('Cannot publish archived content', 400);
    }

    content.status = 'published';
    content.publishedAt = new Date();
    content.updatedAt = new Date();
    await content.save();

    const publishedContent = await content
      .populate('author', 'name email')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Content published successfully',
      data: publishedContent
    });
  })
);

/**
 * @route   PATCH /api/content/:id/archive
 * @desc    Archive content
 * @access  Private (author or admin)
 * @params  {string} id - Content ID
 */
router.patch(
  '/:id/archive',
  authenticate,
  asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Authorization check - only author or admin can archive
    if (req.user.id !== content.author.toString() && !req.user.isAdmin) {
      throw new AppError('You are not authorized to archive this content', 403);
    }

    if (content.status === 'archived') {
      throw new AppError('Content is already archived', 400);
    }

    content.status = 'archived';
    content.updatedAt = new Date();
    await content.save();

    const archivedContent = await content
      .populate('author', 'name email')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      message: 'Content archived successfully',
      data: archivedContent
    });
  })
);

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content (soft delete)
 * @access  Private (author or admin)
 * @params  {string} id - Content ID
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    // Authorization check - only author or admin can delete
    if (req.user.id !== content.author.toString() && !req.user.isAdmin) {
      throw new AppError('You are not authorized to delete this content', 403);
    }

    // Soft delete
    content.deleted = true;
    content.deletedAt = new Date();
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  })
);

/**
 * @route   GET /api/content/statistics/overview
 * @desc    Get content statistics (admin only)
 * @access  Private (admin)
 */
router.get(
  '/statistics/overview',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const stats = await Content.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          publishedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftContent: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          archivedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
          },
          totalViews: { $sum: '$views' },
          avgViews: { $avg: '$views' }
        }
      }
    ]);

    const categoryStats = await Content.aggregate([
      { $match: { deleted: false, status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const authorStats = await Content.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: '$author', count: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'authorInfo' } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalContent: 0,
          publishedContent: 0,
          draftContent: 0,
          archivedContent: 0,
          totalViews: 0,
          avgViews: 0
        },
        categoryStats,
        authorStats
      }
    });
  })
);

/**
 * @route   GET /api/content/user/:userId/statistics
 * @desc    Get user's content statistics
 * @access  Private (user or admin)
 * @params  {string} userId - User ID
 */
router.get(
  '/user/:userId/statistics',
  authenticate,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Authorization check - users can only see their own stats unless admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      throw new AppError('You are not authorized to view these statistics', 403);
    }

    const stats = await Content.aggregate([
      { $match: { author: require('mongoose').Types.ObjectId(userId), deleted: false } },
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          publishedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftContent: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          archivedContent: {
            $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
          },
          totalViews: { $sum: '$views' },
          avgViews: { $avg: '$views' },
          totalComments: { $sum: { $size: '$comments' } }
        }
      }
    ]);

    const topContent = await Content.find({ author: userId, deleted: false, status: 'published' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views createdAt');

    res.status(200).json({
      success: true,
      data: {
        statistics: stats[0] || {
          totalContent: 0,
          publishedContent: 0,
          draftContent: 0,
          archivedContent: 0,
          totalViews: 0,
          avgViews: 0,
          totalComments: 0
        },
        topContent
      }
    });
  })
);

module.exports = router;
