const { Pool } = require('pg');

const pool = new Pool({
  user: 'cms_admin',
  host: '127.0.0.1',
  database: 'case_management_db',
  password: '451789',
  port: 5432
});

async function checkAlpopularPermissions() {
  try {
    // Consultar permisos del rol Alpopular
    const result = await pool.query(`
      SELECT 
        r.name as role_name, 
        p.name as permission_name, 
        p.description 
      FROM roles r
      JOIN role_permissions rp ON r.id = rp."roleId"
      JOIN permissions p ON rp."permissionId" = p.id
      WHERE r.name = 'Alpopular'
      ORDER BY p.name
    `);

    console.log('\n=== PERMISOS DEL ROL ALPOPULAR ===');
    console.log('Total de permisos:', result.rows.length);
    console.log('\nLista de permisos:');
    result.rows.forEach(row => {
      console.log(`  - ${row.permission_name}: ${row.description || 'Sin descripción'}`);
    });

    // Verificar si tiene permisos de knowledge
    const knowledgePerms = result.rows.filter(r => r.permission_name.startsWith('knowledge'));
    console.log('\n=== PERMISOS DE BASE DE CONOCIMIENTO ===');
    console.log('Cantidad:', knowledgePerms.length);
    knowledgePerms.forEach(row => {
      console.log(`  - ${row.permission_name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAlpopularPermissions();
