# ProjectHub

**Current Version:** v0.1.2 (December 2025)  
**Status:** Stable Release | Bug Fixes & Gamification Live

---

## About

**Ship in public. Validate ideas. Build community.**

ProjectHub is a platform for discovering, supporting, and sharing startup projects. It empowers solo creators and indie developers to validate ideas before building, gather feedback during development, and build a community around their work.

**Earn XP, climb leaderboards, and get rewarded for participation.**

> For detailed development history and technical documentation, see [DEVLOG](./DEVLOG/)

---

## Features

### For Creators

- **Multi-Step Project Creation** - Guided flow from idea to launch with draft saving
- **Idea Validation** - Get "Need This", "Curious", or "Rethink" signals before building
- **Live Demo Embedding** - Showcase your project with embedded iframe previews
- **Community Reviews** - Collect star ratings and detailed feedback
- **Analytics Dashboard** - Track page views, link clicks, and engagement
- **Demo View Analytics** - Track who viewed your live demo and earn 1 XP per unique viewer
- **XP & Gamification** - Earn experience points for publishing projects, receiving reviews, and demo views
- **Leaderboard Rankings** - Compete for top spots and earn First 100 and Top 100 badges
- **Roadmap Management** - Share features with upvote/downvote voting
- **Donation Goals** - Accept support via PayPal, Stripe, or Ko-fi integration
- **Direct Messaging** - Connect with reviewers and potential collaborators

### For Users

- **Project Discovery** - Browse by category (Games, SaaS, Tools, Apps, Design)
- **Smart Search** - Find projects and creators with real-time search
- **Guided Exploration** - Four-step accordion flow: Discover → Validate → Try → Review
- **Idea Voting** - Help validate concepts before creators invest time building
- **Anonymous Reviews** - Leave feedback without creating an account
- **Anonymous Editing** - Post anonymously but retain edit/delete rights via session tracking
- **Public Review Recognition** - Opt-in to show your identity on reviews for +2 XP bonus
- **Quick Feedback** - Send short messages directly to creators
- **Reputation Building** - Earn XP for submitting feedback and writing reviews
- **Achievement Badges** - Earn First 100 and Top 100 badges for early adoption and participation

### Platform Features

- **Unified Profiles** - Single identity for both creating and reviewing
- **XP & Leveling System** - Comprehensive gamification with 7 ways to earn XP
- **Leaderboard System** - Dynamic rankings with bot detection and admin moderation
- **Real-Time Updates** - Live notifications for messages, reviews, and XP rewards
- **Mobile Responsive** - Optimized layouts for all screen sizes
- **Third-Party Disclaimers** - Clear warnings for external content
- **Privacy Controls** - Choose to post anonymously or publicly with flexible editing
- **Bot Detection** - Automated suspicious activity tracking with admin review system

### XP Rewards System

Earn experience points for community participation:

- 🚀 **First Project Published:** 50 XP (one-time bonus)
- 📦 **Each Additional Project:** 10 XP
- 👁️ **Project Demo View:** 1 XP (max 1 per viewer per project)
- 💡 **Idea Submitted:** 5 XP
- 👍 **Idea Reaction Received:** 2 XP (max 1 per user per idea)
- ⭐ **Review Received:** 5 XP (to project owner)
- ✍️ **Public Review Bonus:** +2 XP (when reviewer opts into public identity)

**Level Up:** Levels calculated as `sqrt(total_xp / 100) + 1`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Lucide React Icons |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Routing | React Router v6 |
| State | React Context API, Hooks |
| Utilities | date-fns, embla-carousel-react, @dnd-kit |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/projecthub.git
   cd projecthub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   
   Apply migrations in order from `supabase/migrations/` via Supabase Dashboard or CLI.

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── AccordionSection.tsx
│   ├── IdeaReactions.tsx
│   ├── ProjectCard.tsx
│   ├── SearchBar.tsx
│   ├── XPIndicator.tsx
│   └── ...
├── pages/             # Route components
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   ├── ProjectPage.tsx
│   ├── ProjectForm.tsx
│   └── ...
├── contexts/          # React Context providers
│   └── AuthContext.tsx
├── lib/               # External service configs
│   └── supabase.ts
├── types/             # TypeScript definitions
│   └── index.ts
├── constants/         # App-wide constants
│   └── categories.ts
└── utils/             # Helper functions
    └── cardStyles.ts

supabase/
├── migrations (deprecated)/  # Legacy migration files
└── updated schema/          # Current organized schema
    ├── sec1_tables.sql
    ├── sec2_indexes.sql
    ├── sec3_rls_policies.sql
    ├── sec4_functions_triggers.sql
    ├── sec5_frontend_rpc_functions.sql
    ├── sec6_storage_policies.sql
    └── sec7_xp_triggers.sql
```

---

## Roadmap

### Recently Completed (v0.1.2 - December 2025)
- [x] XP & Leaderboard system with bot detection
- [x] Demo view tracking and analytics
- [x] Public review identity system
- [x] Anonymous posting with session-based editing
- [x] Feedback validation tracking
- [x] Achievement badges (First 100, Top 100)
- [x] **Critical bug fixes:**
  - Fixed creator view not updating after first project creation
  - Fixed project hero banner images not persisting
  - Fixed review and feedback submissions failing for all users

### In Progress
- [ ] Profile view tracking (unique visitors instead of page loads)
- [ ] Leaderboard UI page
- [ ] Profile XP breakdown display

### Up Next (v0.2.0 Planning)
- [ ] Problem Board feature (standalone problem validation)
- [ ] Problem claiming system (link solutions to validated problems)
- [ ] Tempmail implementation for demo sandbox security
- [ ] Full-screen mode for demo viewer
- [ ] Bug report feedback feature

### Planned
- [ ] Enhanced achievement badge system
- [ ] Reviewer and voter rewards program (XP multipliers)
- [ ] GitHub commit integration for project updates
- [ ] UI theme customization (dark mode, accent colors)
- [ ] Web3 wallet authentication
- [ ] Downloadable CSV analytics exports
- [ ] Timeline graphs for project progress
- [ ] Mobile-first UI enhancements

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read the [DEVLOG.md](./DEVLOG.md) for technical context and architecture decisions.

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

Built with love for the indie creator community.

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Lucide](https://lucide.dev/) - Beautiful icons
- [React](https://react.dev/) - UI framework
- [Bolt](https://bolt.new) - Host & initial design
- [Cursor](https://cursor.com) - Debugging & scaling
