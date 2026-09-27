const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');

chai.should();
chai.use(chaiHttp);

describe('Family Tasks API', () => {
  let token;
  let userId;
  let familyId;

  before((done) => {
    chai.request(server)
      .post('/register')
      .send({ username: 'testuser', password: 'testpass', email: 'test@example.com' })
      .end((err, res) => {
        res.should.have.status(201);
        userId = res.body.id;
        done();
      });
  });

  it('should register a user', (done) => {
    chai.request(server)
      .post('/register')
      .send({ username: 'testuser2', password: 'testpass2', email: 'test2@example.com' })
      .end((err, res) => {
        res.should.have.status(201);
        done();
      });
  });

  it('should login a user', (done) => {
    chai.request(server)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('token');
        token = res.body.token;
        done();
      });
  });

  it('should create a family', (done) => {
    chai.request(server)
      .post('/family')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Family' })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property('id');
        familyId = res.body.id;
        done();
      });
  });

  it('should join a family', (done) => {
    chai.request(server)
      .post('/family/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId, familyId })
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('should create a task', (done) => {
    chai.request(server)
      .post('/task')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', description: 'Test Description', due_date: '2023-12-31', family_id: familyId, assigned_to: userId })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property('id');
        done();
      });
  });

  it('should mark a task as completed', (done) => {
    chai.request(server)
      .post('/task/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ taskId: 1 })
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  });

  it('should get tasks for a family', (done) => {
    chai.request(server)
      .get(`/tasks/${familyId}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  });

  it('should create a notification', (done) => {
    chai.request(server)
      .post('/notification')
      .set('Authorization', `Bearer ${token}`)
      .send({ task_id: 1, user_id: userId, message: 'Test Notification' })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property('id');
        done();
      });
  });

  it('should get notifications for a user', (done) => {
    chai.request(server)
      .get(`/notifications/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  });
});