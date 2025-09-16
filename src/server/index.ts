import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse, SetFactionResponse, AddKarmaResponse, GetFactionDataResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      const currentUsername = username ?? 'anonymous';
      
      // Get user's faction and contribution
      let userFaction = null;
      let userContribution = 0;
      if (currentUsername !== 'anonymous') {
        const [factionResult, contributionResult] = await Promise.all([
          redis.get(`user:${currentUsername}:faction`),
          redis.get(`user:${currentUsername}:contribution`)
        ]);
        userFaction = factionResult;
        userContribution = contributionResult ? parseInt(contributionResult) : 0;
      }
      
      // Get all faction scores
      const [redScore, blueScore, greenScore, yellowScore] = await Promise.all([
        redis.get('faction:red:karma'),
        redis.get('faction:blue:karma'),
        redis.get('faction:green:karma'),
        redis.get('faction:yellow:karma')
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: currentUsername,
        userFaction: userFaction || undefined,
        userContribution,
        factionScores: {
          red: redScore ? parseInt(redScore) : 0,
          blue: blueScore ? parseInt(blueScore) : 0,
          green: greenScore ? parseInt(greenScore) : 0,
          yellow: yellowScore ? parseInt(yellowScore) : 0,
        }
      } as InitResponse);
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

// Set user's faction
router.post('/api/faction/set', async (req, res): Promise<void> => {
  try {
    const { factionId } = req.body;
    const userId = context.userId;
    const username = userId ? (await reddit.getUserById(userId))?.username : 'anonymous';
    
    if (!factionId || !username) {
      res.status(400).json({ error: 'Missing factionId or username' });
      return;
    }

    // Store user's faction choice
    await redis.set(`user:${username}:faction`, factionId);
    
    res.json({
      type: 'setFaction',
      success: true,
      factionId
    } as SetFactionResponse);
  } catch (error) {
    console.error('Error setting user faction:', error);
    res.status(500).json({ error: 'Failed to set faction' });
  }
});

// Add karma to faction
router.post('/api/karma/add', async (req, res): Promise<void> => {
  try {
    const { factionId, karma } = req.body;
    const userId = context.userId;
    const username = userId ? (await reddit.getUserById(userId))?.username : 'anonymous';
    
    if (!factionId || karma === undefined) {
      res.status(400).json({ error: 'Missing factionId or karma' });
      return;
    }

    // Add karma to faction total
    const newScore = await redis.incrBy(`faction:${factionId}:karma`, karma);
    
    // Also track user's contribution to their faction
    if (username && username !== 'anonymous') {
      await redis.incrBy(`user:${username}:contribution`, karma);
    }
    
    res.json({
      type: 'addKarma',
      success: true,
      factionId,
      newScore,
      karmaAdded: karma
    } as AddKarmaResponse);
  } catch (error) {
    console.error('Error adding karma to faction:', error);
    res.status(500).json({ error: 'Failed to add karma' });
  }
});

// Get all faction data
router.get('/api/faction/data', async (_req, res): Promise<void> => {
  try {
    const userId = context.userId;
    const username = userId ? (await reddit.getUserById(userId))?.username : 'anonymous';
    
    // Get user's faction
    let userFaction = null;
    if (username && username !== 'anonymous') {
      userFaction = await redis.get(`user:${username}:faction`);
    }
    
    // Get all faction scores
    const [northScore, southScore, eastScore, westScore] = await Promise.all([
      redis.get('faction:north:karma'),
      redis.get('faction:south:karma'),
      redis.get('faction:east:karma'),
      redis.get('faction:west:karma')
    ]);

    res.json({
      type: 'factionData',
      userFaction: userFaction || undefined,
      factionScores: {
        north: northScore ? parseInt(northScore) : 0,
        south: southScore ? parseInt(southScore) : 0,
        east: eastScore ? parseInt(eastScore) : 0,
        west: westScore ? parseInt(westScore) : 0,
      }
    } as GetFactionDataResponse);
  } catch (error) {
    console.error('Error getting faction data:', error);
    res.status(500).json({ error: 'Failed to get faction data' });
  }
});

router.get('/api/avatar/:username', async (req, res): Promise<void> => {
  try {
    const { username } = req.params;
    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    // Use Reddit API to get user info
    const user = await reddit.getUserByUsername(username);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get avatar URL from user data
    const avatarUrl = await user.getSnoovatarUrl();
    if (!avatarUrl) {
      res.status(404).json({ error: 'No avatar found for user' });
      return;
    }

    res.json({ avatarUrl });
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
