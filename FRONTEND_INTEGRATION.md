# DUECH PostgreSQL Backend - Frontend Integration Guide

## Quick Overview

This PostgreSQL backend stores Chilean Spanish dictionary data with **4 tables** using a simplified relational model with embedded JSONB data.

---

## Database Connection

**Development (Local Docker):**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=duech
POSTGRES_USER=duech
POSTGRES_PASSWORD=<from .env file>
```

**Recommended Node.js Client:** `pg` (already used in backend scripts)

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});
```

---

## Database Schema (4 Tables)

### 1. **users** - Authentication & Editorial Tracking
```sql
id              SERIAL PRIMARY KEY
username        TEXT UNIQUE NOT NULL
email           TEXT UNIQUE
password_hash   TEXT NOT NULL
role            TEXT DEFAULT 'lexicographer'  -- lexicographer, editor, admin, superadmin
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

**Default Admin:** username: `admin`, password: `admin123` (change in production!)

---

### 2. **words** - Dictionary Headwords
```sql
id              SERIAL PRIMARY KEY
lemma           TEXT NOT NULL              -- The word itself (e.g., 'depa', 'fome')
root            TEXT                       -- Root form (usually same as lemma)
letter          CHAR(1) NOT NULL           -- First letter (a-z, ñ)
variant         TEXT                       -- Alternative spelling (e.g., 'huaipe' for 'guaipe')
status          TEXT DEFAULT 'draft'       -- draft, in_review, reviewed, rejected, published
created_by      INT REFERENCES users(id)
assigned_to     INT REFERENCES users(id)
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()
```

**Status Workflow:** draft → in_review → reviewed → published (or rejected)

---

### 3. **meanings** - Word Definitions (⚠️ Contains Embedded Data)
```sql
id              SERIAL PRIMARY KEY
word_id         INT REFERENCES words(id) ON DELETE CASCADE
number          INT NOT NULL               -- Meaning number (1, 2, 3...)
origin          TEXT                       -- Etymology (e.g., 'inglés', 'quechua')
meaning         TEXT NOT NULL              -- The definition
observation     TEXT                       -- Usage notes, pronunciation guides
remission       TEXT                       -- Cross-reference to another word
categories      TEXT[]                     -- Array: ['m', 'f', 'adj', 'tr', 'intr']
styles          TEXT[]                     -- Array: ['espon', 'vulgar', 'hist', 'fest']
examples        JSONB                      -- ⚠️ EMBEDDED: Array of example objects
expressions     TEXT[]                     -- ⚠️ EMBEDDED: Array of expression strings
created_at      TIMESTAMP DEFAULT now()
updated_at      TIMESTAMP DEFAULT now()

UNIQUE(word_id, number)
```

**⚠️ CRITICAL - examples JSONB Structure:**
```javascript
[
  {
    "value": "Example sentence here",
    "author": "Author name",        // optional
    "title": "Work title",          // optional
    "source": "Source publication", // optional
    "date": "2024-01-01",          // optional, ISO format
    "page": "123"                   // optional, string (can be "p. A2 [cit...]")
  }
]
```

**⚠️ CRITICAL - expressions Array:**
```javascript
['expression 1', 'expression 2', 'expression 3']
```

---

### 4. **notes** - Editorial Comments
```sql
id              SERIAL PRIMARY KEY
word_id         INT REFERENCES words(id) ON DELETE CASCADE
user_id         INT REFERENCES users(id)
note            TEXT NOT NULL
resolved        BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT now()
```

---

## Key Frontend Queries

### 1. Get All Words (with meaning count)
```sql
SELECT
    w.id,
    w.lemma,
    w.root,
    w.letter,
    w.status,
    COUNT(m.id) as meaning_count
FROM words w
LEFT JOIN meanings m ON w.id = m.word_id
GROUP BY w.id
ORDER BY w.lemma;
```

### 2. Get Single Word (Full Details)
```sql
SELECT
    w.id,
    w.lemma,
    w.root,
    w.letter,
    w.variant,
    w.status,
    json_agg(
        json_build_object(
            'id', m.id,
            'number', m.number,
            'origin', m.origin,
            'meaning', m.meaning,
            'observation', m.observation,
            'remission', m.remission,
            'categories', m.categories,
            'styles', m.styles,
            'examples', m.examples,        -- Already JSONB
            'expressions', m.expressions    -- Already array
        ) ORDER BY m.number
    ) as meanings
FROM words w
LEFT JOIN meanings m ON w.id = m.word_id
WHERE w.lemma = $1
GROUP BY w.id;
```

### 3. Search Words (Full-Text)
```sql
SELECT
    w.lemma,
    w.letter,
    ts_rank(to_tsvector('spanish', w.lemma), query) as rank
FROM words w,
     to_tsquery('spanish', $1) query
WHERE to_tsvector('spanish', w.lemma) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### 4. Search in Meanings
```sql
SELECT
    w.lemma,
    m.meaning,
    ts_rank(to_tsvector('spanish', m.meaning), query) as rank
FROM meanings m
JOIN words w ON m.word_id = w.id,
     to_tsquery('spanish', $1) query
WHERE to_tsvector('spanish', m.meaning) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### 5. Browse by Letter
```sql
SELECT
    w.lemma,
    w.root,
    w.status
FROM words w
WHERE w.letter = $1
ORDER BY w.lemma;
```

### 6. Search in Examples (JSONB Query)
```sql
SELECT
    w.lemma,
    m.meaning,
    m.examples
FROM meanings m
JOIN words w ON m.word_id = w.id
WHERE m.examples::text ILIKE '%' || $1 || '%';
```

### 7. Filter by Style
```sql
SELECT
    w.lemma,
    m.meaning,
    m.styles
FROM meanings m
JOIN words w ON m.word_id = w.id
WHERE $1 = ANY(m.styles);  -- e.g., 'vulgar', 'espon'
```

---

## Important Frontend Considerations

### 1. **JSONB Examples Handling**
Examples are stored as JSONB, so they come as parsed objects already:
```typescript
// TypeScript type
interface Example {
  value: string;
  author?: string;
  title?: string;
  source?: string;
  date?: string;
  page?: string;
}

// Query result
const result = await pool.query('SELECT examples FROM meanings WHERE id = $1', [meaningId]);
const examples: Example[] = result.rows[0].examples; // Already parsed!
```

### 2. **Array Fields (categories, styles, expressions)**
PostgreSQL arrays come as JavaScript arrays:
```typescript
const categories: string[] = result.rows[0].categories; // ['m', 'f']
const styles: string[] = result.rows[0].styles;         // ['espon']
const expressions: string[] = result.rows[0].expressions; // ['expr1', 'expr2']
```

### 3. **Full-Text Search**
Use Spanish language configuration for better stemming:
```sql
to_tsvector('spanish', text_field)
to_tsquery('spanish', search_term)
```

### 4. **Status-Based Filtering**
Only show published words to public users:
```sql
WHERE w.status = 'published'
```

For admin dashboard, show all statuses.

### 5. **Pagination**
```sql
SELECT ... FROM words
LIMIT $1 OFFSET $2;  -- e.g., LIMIT 20 OFFSET 0
```

---

## Recommended Next.js API Routes

### `/api/words` - List all words
```typescript
GET /api/words?letter=a&status=published&page=1&limit=20
```

### `/api/words/[lemma]` - Get single word
```typescript
GET /api/words/depa
// Returns word with all meanings, examples, expressions
```

### `/api/search` - Full-text search
```typescript
GET /api/search?q=casa&type=word|meaning|example
```

### `/api/letters/[letter]` - Browse by letter
```typescript
GET /api/letters/o
// Returns all words starting with 'o'
```

### `/api/admin/words` - Admin CRUD (protected)
```typescript
POST   /api/admin/words        // Create word
PUT    /api/admin/words/[id]   // Update word
DELETE /api/admin/words/[id]   // Delete word
PATCH  /api/admin/words/[id]/status  // Change status
```

---

## Sample TypeScript Types for Frontend

```typescript
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'lexicographer' | 'editor' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
}

export interface Word {
  id: number;
  lemma: string;
  root: string;
  letter: string;
  variant?: string;
  status: 'draft' | 'in_review' | 'reviewed' | 'rejected' | 'published';
  created_by?: number;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  meanings?: Meaning[];  // When joined
}

export interface Meaning {
  id: number;
  word_id: number;
  number: number;
  origin?: string;
  meaning: string;
  observation?: string;
  remission?: string;
  categories: string[];
  styles: string[];
  examples: Example[];      // ⚠️ JSONB field
  expressions: string[];    // ⚠️ Array field
  created_at: string;
  updated_at: string;
}

export interface Example {
  value: string;
  author?: string;
  title?: string;
  source?: string;
  date?: string;
  page?: string;
}

export interface Note {
  id: number;
  word_id: number;
  user_id?: number;
  note: string;
  resolved: boolean;
  created_at: string;
}
```

---

## Environment Setup for Next.js

```env
# .env.local
DATABASE_URL=postgresql://duech:your_password@localhost:5432/duech

# Or individual vars
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=duech
POSTGRES_USER=duech
POSTGRES_PASSWORD=your_password
```

---

## Testing the Connection

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function testConnection() {
  const result = await pool.query('SELECT COUNT(*) FROM words');
  console.log('Total words:', result.rows[0].count);
}

export default pool;
```

---

## Key Differences from Typical Schemas

1. **Examples are JSONB** (not a separate table) - Always fetched with meanings
2. **Expressions are TEXT[]** (not a separate table) - Simple string array
3. **Categories/Styles are arrays** - Use `ANY()` for filtering
4. **No separate Letters table** - Just CHAR(1) field in words
5. **No semantic relationships table yet** - Potential future enhancement

---

## Performance Notes

- All foreign keys are indexed automatically
- Full-text indexes on `words.lemma` and `meanings.meaning`
- JSONB `examples` field has GIN index for deep queries
- Spanish language configuration for better search results
- Current dataset: ~69 words, ~76 meanings (small, will scale to millions)

---

## Questions to Ask the User (Next.js App)

1. Should public users see only `status='published'` words?
2. Do you need authentication/authorization (login system)?
3. Should there be an admin panel for word management?
4. Do you need search history or user favorites?
5. Should examples/expressions be expandable/collapsible in UI?

---

## Common Query Examples for Frontend

### Get word with all related data
```typescript
// lib/queries.ts
import pool from './db';

export async function getWordByLemma(lemma: string) {
  const result = await pool.query(`
    SELECT
      w.id,
      w.lemma,
      w.root,
      w.letter,
      w.variant,
      w.status,
      w.created_at,
      w.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'number', m.number,
            'origin', m.origin,
            'meaning', m.meaning,
            'observation', m.observation,
            'remission', m.remission,
            'categories', m.categories,
            'styles', m.styles,
            'examples', m.examples,
            'expressions', m.expressions
          ) ORDER BY m.number
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as meanings
    FROM words w
    LEFT JOIN meanings m ON w.id = m.word_id
    WHERE w.lemma = $1
    GROUP BY w.id
  `, [lemma]);

  return result.rows[0] || null;
}
```

### Search across all fields
```typescript
export async function searchDictionary(query: string, limit = 20) {
  const result = await pool.query(`
    SELECT DISTINCT
      w.lemma,
      w.letter,
      w.status,
      ts_rank(
        to_tsvector('spanish', w.lemma || ' ' || COALESCE(string_agg(m.meaning, ' '), '')),
        to_tsquery('spanish', $1)
      ) as rank
    FROM words w
    LEFT JOIN meanings m ON w.id = m.word_id
    WHERE
      to_tsvector('spanish', w.lemma || ' ' || COALESCE(string_agg(m.meaning, ' '), ''))
      @@ to_tsquery('spanish', $1)
    GROUP BY w.id
    ORDER BY rank DESC
    LIMIT $2
  `, [query, limit]);

  return result.rows;
}
```

### Get words by letter with pagination
```typescript
export async function getWordsByLetter(
  letter: string,
  page = 1,
  limit = 20
) {
  const offset = (page - 1) * limit;

  const result = await pool.query(`
    SELECT
      w.id,
      w.lemma,
      w.root,
      w.status,
      COUNT(m.id) as meaning_count
    FROM words w
    LEFT JOIN meanings m ON w.id = m.word_id
    WHERE w.letter = $1 AND w.status = 'published'
    GROUP BY w.id
    ORDER BY w.lemma
    LIMIT $2 OFFSET $3
  `, [letter, limit, offset]);

  // Get total count for pagination
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM words WHERE letter = $1 AND status = $2',
    [letter, 'published']
  );

  return {
    words: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
  };
}
```

---

This should give the frontend developer everything needed to connect and query the database efficiently!
