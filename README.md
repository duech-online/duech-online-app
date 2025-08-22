# 📚 DUECh Online App

A web application to host and navigate the **Diccionario del Uso del Español de Chile (DUECh)**, integrating multiple historical dictionaries and allowing researchers to explore relationships between words, meanings, and sources.

Built with **Next.js** for the frontend and **Neo4j** for graph-based semantic modeling.

---

## 🚀 Features

- Explore Chilean Spanish words and definitions
- Graph-based structure to represent semantic and historical relationships
- API layer for CRUD operations on dictionary entries
- Modern Next.js frontend with server-side rendering (SSR)
- Scalable architecture ready for production

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Neo4j](https://neo4j.com/) (Graph database)
- **ORM/Driver**: [Neo4j JavaScript Driver](https://neo4j.com/developer/javascript/)
- **Deployment**: [Vercel](https://vercel.com/) (Frontend) + [Neo4j Aura](https://neo4j.com/cloud/aura/) (Database)

---

## 📦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/duech-online-app.git
cd duech-online-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
duech-online-app/
│
├── lib/
│   └── neo4j.ts          # Neo4j driver configuration
├── models/
│   └── word.ts           # Data access layer for words
├── pages/
│   ├── api/              # API routes for dictionary CRUD
│   └── index.tsx         # Home page
├── components/           # Reusable UI components
└── .env.local            # Environment variables
```

---

## ✅ Example API Usage

**Add a Word**

`POST /api/words`

```json
{
  "text": "cachai",
  "language": "es-CL",
  "definition": "Expresión utilizada para confirmar comprensión.",
  "source": "Diccionario Chileno 1998"
}
```

---

## 🔮 Roadmap

- [ ] Build graph schema for words, synonyms, and historical relationships
- [ ] Implement full-text search and filters
- [ ] Integrate user authentication and contribution workflow
- [ ] Deploy to Vercel (Frontend) + Neo4j Aura (DB)
- [ ] Add API and data export options

---

## 📜 License

MIT License – free to use and adapt.
