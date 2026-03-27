const { Client } = require('pg');

exports.handler = async (event, context) => {
    // Hanya menerima metode POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Menangkap data yang dikirim dari login.html
    const { nama, nis, password } = JSON.parse(event.body);

    // Menyambungkan ke Database Neon
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Wajib untuk Neon
    });

    try {
        await client.connect();

        // 1. Cek apakah NIS sudah ada di database
        const checkUser = await client.query('SELECT * FROM users_lentera WHERE nis = $1', [nis]);

        if (checkUser.rows.length > 0) {
            // JIKA USER SUDAH ADA (Fungsi Login)
            const user = checkUser.rows[0];
            
            // Cocokkan Password
            if (user.password === password) {
                return { 
                    statusCode: 200, 
                    body: JSON.stringify({ success: true, message: 'Login berhasil!', data: user }) 
                };
            } else {
                return { 
                    statusCode: 401, 
                    body: JSON.stringify({ success: false, message: 'Kata sandi salah! Coba lagi.' }) 
                };
            }
        } else {
            // JIKA USER BELUM ADA (Fungsi Register)
            const insertUser = await client.query(
                'INSERT INTO users_lentera (nama, nis, password) VALUES ($1, $2, $3) RETURNING *',
                [nama, nis, password]
            );
            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, message: 'Akun baru berhasil dibuat!', data: insertUser.rows[0] }) 
            };
        }
    } catch (error) {
        console.error("Database Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ success: false, message: 'Terjadi kesalahan pada server database.' }) 
        };
    } finally {
        await client.end();
    }
};