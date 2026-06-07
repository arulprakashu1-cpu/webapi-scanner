const sqlite3 = require('better-sqlite3');

try {
  const db = sqlite3('d:/cl API/webapi-scanner/backend/scanner.db');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('=== Tables Found: ' + tables.length + ' ===\n');
  tables.forEach(t => {
    const cols = db.prepare('PRAGMA table_info("' + t.name + '")').all();
    const count = db.prepare('SELECT COUNT(*) as c FROM "' + t.name + '"').get();
    console.log('[' + t.name + '] — ' + count.c + ' rows');
    cols.forEach(c => {
      let line = '  ' + c.cid + '. ' + c.name + ' (' + c.type + ')';
      if (c.pk) line += ' PK';
      if (c.notnull) line += ' NOT NULL';
      if (c.dflt_value !== null) line += ' DEFAULT ' + c.dflt_value;
      console.log(line);
    });
    console.log('');
  });
  db.close();
} catch(e) {
  console.error('Error:', e.message);
}
