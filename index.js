const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;

const app = express();

// OAuth2 configuration - adjust these values for your Keycloak server
const oauth2Config = {
    authorizationURL: 'http://localhost:8080/realms/master/protocol/openid-connect/auth',
    tokenURL: 'http://localhost:8080/realms/master/protocol/openid-connect/token',
    userProfileURL: "http://localhost:8080/realms/master/protocol/openid-connect/userinfo",
    logoutURL: 'http://localhost:8080/realms/master/protocol/openid-connect/logout',
    clientID: "GraphXR-iframe-demo",
    clientSecret: "pnpuQGG4b4gRLb35WhFaEPN4xVBAO4Tx",
    scope: 'openid,email,profile',
    callbackURL: "http://localhost:3080/oauth2/callback",
    scope: ['openid', 'profile', 'email']
};

// Session setup
app.use(session({
    secret: 'graphxr-iframe-demo',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Configure OAuth2 strategy
passport.use(new OAuth2Strategy(oauth2Config,
    (accessToken, refreshToken, params, profile, done) => {
         // Parse token content
        const tokenContent = JSON.parse(
            Buffer.from(accessToken.split('.')[1], 'base64').toString()
        );
        
        return done(null, { accessToken, refreshToken, tokenContent, params });
    }
));

// Protect middleware
const protect = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/oauth2/login');
};

// Home page
app.get('/', (req, res) => {
    res.send('<h1>Welcome to GraphXR iframeAuth Demo</h1><a href="/secure">Access GraphXR Embedded Example</a>');
});

// Login route
app.get('/oauth2/login', passport.authenticate('oauth2'));

// OAuth callback
app.get('/oauth2/callback', passport.authenticate('oauth2', {
    successRedirect: '/secure',
    failureRedirect: '/'
}));

// Protected page
app.get('/secure', protect, (req, res) => {
    const accessToken = req.user.accessToken;
    const tokenContent = req.user.tokenContent;
    const email = tokenContent.email || '(Email field not found)';

    console.log('Access Token:', accessToken);
    
    res.send(`
        <h1>Welcome to the GraphXR iframeAuth Demo! You are successfully authenticated. <a href="/logout">Logout</a></div>
        <div style="margin-top: 20px; text-align: center;">
            <iframe 
                src="http://localhost:9000/projects?token=${encodeURIComponent(accessToken)}&email=${encodeURIComponent(email)}" 
                width="100%" 
                height="800" 
                style="border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" 
                title="GraphXR Projects" 
                loading="lazy">
            </iframe>
        </div>
    `);
});

// Logout route
app.get('/logout', (req, res) => {
    const idToken = req?.session?.passport?.user?.params?.id_token || req.sessionID;  
    req.logout(err => {
        if (err) return next(err);
        const redirectUri = encodeURIComponent('http://localhost:3080');
        res.redirect(`${oauth2Config.logoutURL}?post_logout_redirect_uri=${redirectUri}&id_token_hint=${idToken}`);
    });
});

// Start server
const PORT = process.env.PORT || 3080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
