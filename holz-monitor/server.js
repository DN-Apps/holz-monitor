require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

let dbReady = false;
let dbRetryTimer = null;

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'holzmonitor',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres'
});

async function initDb() {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS messungen (
      id SERIAL PRIMARY KEY,
    sensor_id INTEGER,
      abstand FLOAT NOT NULL,
      zeitstempel TIMESTAMP DEFAULT NOW()
    )
  `);

    await pool.query('ALTER TABLE messungen ADD COLUMN IF NOT EXISTS sensor_id INTEGER');
    await pool.query('UPDATE messungen SET sensor_id = 1 WHERE sensor_id IS NULL');
    await pool.query('ALTER TABLE messungen ALTER COLUMN sensor_id SET DEFAULT 1');
    await pool.query('ALTER TABLE messungen ALTER COLUMN sensor_id SET NOT NULL');

    dbReady = true;
    console.log('Datenbank bereit!');
}

async function initDbWithRetry() {
    try {
        await initDb();
    } catch (error) {
        dbReady = false;
        console.error('Datenbank nicht erreichbar. Neuer Versuch in 10 Sekunden.');
        console.error(error.message);

        if (!dbRetryTimer) {
            dbRetryTimer = setTimeout(() => {
                dbRetryTimer = null;
                initDbWithRetry();
            }, 10000);
        }
    }
}

app.post('/sensor', async (req, res) => {
    try {
        const payload = req.body || {};
        const messungen = [];

        if (Array.isArray(payload.messungen)) {
            for (const eintrag of payload.messungen) {
                messungen.push({ sensor_id: Number(eintrag.sensor_id), abstand: Number(eintrag.abstand) });
            }
        } else if ([payload.s1, payload.s2, payload.s3, payload.s4].some((wert) => wert !== undefined)) {
            const map = [payload.s1, payload.s2, payload.s3, payload.s4];
            for (let i = 0; i < map.length; i += 1) {
                if (map[i] === undefined) continue;
                messungen.push({ sensor_id: i + 1, abstand: Number(map[i]) });
            }
        } else {
            messungen.push({
                sensor_id: payload.sensor_id === undefined ? 1 : Number(payload.sensor_id),
                abstand: Number(payload.abstand),
            });
        }

        const gueltigeMessungen = messungen.filter((eintrag) => {
            const istSensorGueltig = Number.isInteger(eintrag.sensor_id) && eintrag.sensor_id >= 1 && eintrag.sensor_id <= 4;
            const istAbstandGueltig = Number.isFinite(eintrag.abstand) && eintrag.abstand >= 0 && eintrag.abstand <= 300;
            return istSensorGueltig && istAbstandGueltig;
        });

        if (gueltigeMessungen.length === 0) {
            return res.status(400).json({ error: 'Keine gueltigen Messwerte gefunden.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const messung of gueltigeMessungen) {
                await client.query('INSERT INTO messungen (sensor_id, abstand) VALUES ($1, $2)', [messung.sensor_id, messung.abstand]);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        console.log(`Gespeichert: ${gueltigeMessungen.length} Messungen`);
        return res.status(201).json({ status: 'ok', gespeichert: gueltigeMessungen.length });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Interner Serverfehler.' });
    }
});

app.get('/sensor', async (req, res) => {
    try {
        const result = await pool.query(`
    SELECT sensor_id, abstand, zeitstempel
    FROM (
    SELECT DISTINCT ON (sensor_id)
      sensor_id,
      abstand,
      zeitstempel
    FROM messungen
    ORDER BY sensor_id, zeitstempel DESC
    ) latest
    ORDER BY sensor_id ASC
  `);
        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Interner Serverfehler.' });
    }
});

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        dbReady = true;
        return res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        dbReady = false;
        return res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

app.listen(PORT, () => {
    console.log(`Server laeuft auf Port ${PORT}`);
    initDbWithRetry();
    if (!dbReady) {
        console.log('Hinweis: API startet, auch wenn die Datenbank noch nicht verbunden ist.');
    }
});