# ProjectHub

**Ship in public. Validate ideas. Build community.**

ProjectHub is a platform for discovering, supporting, and sharing startup projects. It empowers solo creators and indie developers to validate ideas before building, gather feedback during development, and build a community around their work.

> For detailed development history and technical documentation, see [DEVLOG.md](./DEVLOG.md)

---

## Features

### For Creators

- **Multi-Step Project Creation** - Guided flow from idea to launch with draft saving
- **Idea Validation** - Get "Need This", "Curious", or "Rethink" signals before building
- **Live Demo Embedding** - Showcase your project with embedded iframe previews
- **Community Reviews** - Collect star ratings and detailed feedback
- **Analytics Dashboard** - Track page views, link clicks, and engagement
- **Roadmap Management** - Share features with upvote/downvote voting
- **Donation Goals** - Accept support via PayPal, Stripe, or Ko-fi integration
- **Direct Messaging** - Connect with reviewers and potential collaborators

### For Users

- **Project Discovery** - Browse by category (Games, SaaS, Tools, Apps, Design)
- **Smart Search** - Find projects and creators with real-time search
- **Guided Exploration** - Four-step accordion flow: Discover → Validate → Try → Review
- **Idea Voting** - Help validate concepts before creators invest time building
- **Anonymous Reviews** - Leave feedback without creating an account
- **Quick Feedback** - Send short messages directly to creators

### Platform Features

- **Unified Profiles** - Single identity for both creating and reviewing
- **Real-Time Updates** - Live notifications for messages and reviews
- **Mobile Responsive** - Optimized layouts for all screen sizes
- **Third-Party Disclaimers** - Clear warnings for external content

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
│   ├── IdeaSentiment.tsx
│   ├── ProjectCard.tsx
│   ├── SearchBar.tsx
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
└── migrations/        # Database schema migrations
```

---

## Roadmap

### In Progress
- [ ] Tempmail implementation for demo sandbox security
- [ ] Full-screen mode for demo viewer
- [ ] Bug report feedback feature

### Planned
- [ ] GitHub commit integration for project updates
- [ ] UI theme customization (dark mode, accent colors)
- [ ] Web3 wallet authentication
- [ ] Enhanced ideation-to-creation workflow
- [ ] Downloadable CSV analytics exports
- [ ] Timeline graphs for project progress
- [ ] Mobile-first UI enhancements
- [ ] Achievement badges system
- [ ] Reviewer and voter rewards program

### Future Considerations
- API for third-party integrations
- Team collaboration features
- Project templates and boilerplates
- AI-powered idea validation insights

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
