


export default async function AuthRoutes(app) {
    await app.addHook('onRequest', async (req, res) => {
        if(!req.session.get('user')) {
            res.redirect('/login');
        }
    });

    app.get('/', async (req, res) => {
        const {delete: del, done} = req.query;
        let session = undefined;
        const user = req.session.get('user');
        if(user) {
            session = {user};
        }


        if(del) {
            const delResult = await app.pg.query('DELETE FROM todos WHERE id = $1', [del]);
            if(delResult.rowCount != 1) {
                throw new Error('something wrong');
            }

            res.redirect('/');
        } 

        if(done) {
            const doneResult = await app.pg.query(
                'UPDATE todos SET done = NOT done WHERE id = $1', 
                [done]);

            if(doneResult.rowCount != 1) {
                throw new Error('something wrong');
            }

            res.redirect('/');
        }

        const result = await app.pg.query('SELECT * FROM todos ORDER BY id');
        return res.view('./views/index.ejs', {todos: result.rows, session});

    });

    app.get('/create', async (req, res) => {
        return res.view('./views/create.ejs');
    });

    app.post('/create', async (req, res) => {
        const result = await app.pg.query(
            'INSERT INTO todos (label, done) VALUES ($1, $2)',
            [req.body.label, !!req.body.done]
        );

        if(result.rowCount !== 1) {
            throw new Error('don\'t know...');
        }

        res.redirect('/');
    });

    app.get('/edit', async (req, res) => {
        const id = req.query.id;
        if(id === undefined) {
            res.redirect('/');
            return;
        }

        const detail = await app.pg.query('SELECT * FROM todos WHERE id = $1', [id]);

        if(detail.rows.length !== 1) {
            res.redirect('/');
            return;
        }

        const todo = detail.rows[0]; 

        return res.view('./views/edit.ejs', {todo});
    });

    app.post('/edit', async (req, res) => {
        const result = await app.pg.query(
            'UPDATE todos SET label = $1, done = $2 WHERE id = $3',
            [req.body.label, !!req.body.done, req.body.id]
        );

        if(result.rowCount !== 1) {
            throw new Error('don\'t know...');
        }

        res.redirect('/');
    });

    app.get('/about', async (req, res) => {
        return res.view('./views/about.ejs');
    });

    app.get('/logout', async (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    });
}