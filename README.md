# ProjectHub

ProjectHub is a platform for discovering, supporting, and sharing startup projects. It empowers solo creators and freelancers to ship in public, gather feedback, and build a community around their work.

## 🚀 Features

- **Project Discovery**: Browse projects by category (Games, SaaS, Tools, Apps, Design, etc.) or search for specific projects and creators.
- **Project Showcases**: Detailed project pages with overviews, images, and links.
- **Community Reviews**: Users can leave ratings and detailed reviews for projects.
- **Idea & Feedback**: Dedicated tab for sharing ideas and gathering feedback on projects.
- **Creator Profiles**: Public profiles for creators to showcase their portfolio and stats.
- **Dashboard**:
  - **For Creators**: Manage projects, track analytics (views, clicks), and view feedback.
  - **For Users**: Track reviews given, discover new projects, and manage personal settings.
- **Authentication**: Secure login and signup via Supabase Auth.

## 🛠️ Tech Stack

- **Frontend Framework**: [React](https://react.dev/) (with [Vite](https://vitejs.dev/))
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Lucide React](https://lucide.dev/) icons
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Routing**: [React Router](https://reactrouter.com/)
- **State Management**: React Context API & Hooks
- **UI Components**: Custom components including Carousels (`embla-carousel-react`) and Drag & Drop (`@dnd-kit`).

## 📦 Installation

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/projecthub.git
   cd projecthub
   ```

2. **Install dependencies**
    ```
    npm install
    ```
3. **Environment Setup**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the development server**
    ```
    npm run dev
    ```

## 🗂️ Project Structure

- **`src/pages`**: Main views including Home, Dashboard, ProjectPage, ProfilePage, and Login.
- **`src/components`**: Reusable UI components like `BrowseProjects`, `SearchBar`, `ProjectCard`, and `NavBar`.
- **`src/contexts`**: Global state management (e.g., `AuthContext`).
- **`src/lib`**: Configuration for external services (Supabase client).
- **`src/constants`**: Application-wide constants (e.g., `categories.ts`).
- **`src/types`**: TypeScript definitions for robust type checking.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
