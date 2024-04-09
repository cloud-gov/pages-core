const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const {
  BuildTask, BuildTaskType, Build, User,
} = require('../../../api/models');

function clean() {
  return Promise.all([
    Build.truncate({ force: true, cascade: true }),
    BuildTask.truncate({ force: true, cascade: true }),
    BuildTaskType.truncate({ force: true, cascade: true }),
    User.truncate({ force: true, cascade: true }),
  ]);
}

async function prepTasks() {
  const user = await factory.user();
  const cookie = await authenticatedSession(user);
  const site = await factory.site({ users: [user] });
  const build = await factory.build({ user, site });

  const task = await factory.buildTask({ build });
  await factory.buildTask({ build });
  return { cookie, build, task };
}

describe('Build Task API', () => {
  before(async () => {
    await clean();
  });

  afterEach(clean);

  describe('GET /v0/build/:build_id/tasks', () => {
    it('should require authentication', (done) => {
      factory.buildTask().then(buildTask => request(app)
        .get(`/v0/build/${buildTask.buildId}/tasks`)
        .expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/tasks', 403, response.body);
          done();
        }).catch(done);
    });

    it('should list build tasks', async () => {
      const { cookie, build } = await prepTasks();

      const response = await request(app)
        .get(`/v0/build/${build.id}/tasks`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/build/{build_id}/tasks', 200, response.body);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      expect(response.body[0]).to.have.keys([
        'artifact',
        'buildId',
        'buildTaskTypeId',
        'BuildTaskType',
        'createdAt',
        'id',
        'message',
        'count',
        // 'name',
        'status',
        'updatedAt',
      ]);
    });

    it('should not list build tasks if user is not associated to the build', async () => {
      const anotherUser = await factory.user();
      const differentCookie = await authenticatedSession(anotherUser);
      const { build } = await prepTasks();

      const response = await request(app)
        .get(`/v0/build/${build.id}/tasks`)
        .set('Cookie', differentCookie)
        .expect(404);

      validateAgainstJSONSchema('GET', '/build/{build_id}/tasks', 404, response.body);
    });
  });

  describe('GET /v0/build/:build_id/tasks/:task_id', () => {
    it('should require authentication', (done) => {
      factory.buildTask().then(buildTask => request(app)
        .get(`/v0/build/${buildTask.buildId}/tasks/${buildTask.id}`)
        .expect(403))
        .then((response) => {
          validateAgainstJSONSchema('GET', '/build/{build_id}/tasks/{task_id}', 404, response.body);
          done();
        }).catch(done);
    });

    it('should fetch one build task', async () => {
      const { cookie, build, task } = await prepTasks();

      const response = await request(app)
        .get(`/v0/build/${build.id}/tasks/${task.id}`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema('GET', '/build/{build_id}/tasks/{task_id}', 200, response.body);
      expect(response.body).to.be.an('object');
      expect(response.body).to.have.keys([
        'artifact',
        'buildId',
        'buildTaskTypeId',
        'BuildTaskType',
        'createdAt',
        'id',
        'message',
        'count',
        'name',
        'status',
        'updatedAt',
      ]);
      expect(response.body.buildId).to.be.equal(build.id);
    });

    it('should not get build task if user is not associated to the build', async () => {
      const anotherUser = await factory.user();
      const differentCookie = await authenticatedSession(anotherUser);
      const { build, task } = await prepTasks();

      const response = await request(app)
        .get(`/v0/build/${build.id}/tasks/${task.id}`)
        .set('Cookie', differentCookie)
        .expect(404);

      validateAgainstJSONSchema('GET', '/build/{build_id}/tasks', 404, response.body);
    });

    it('should not get build task if the build is not associated to the build task', async () => {
      const anotherBuild = await factory.build();
      const { task, cookie } = await prepTasks();

      const response = await request(app)
        .get(`/v0/build/${anotherBuild.id}/tasks/${task.id}`)
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema('GET', '/build/{build_id}/tasks', 404, response.body);
    });
  });

  describe('PUT /v0/tasks/:build_task_id/:token', () => {
    it('should require a matching token', async () => {
      const { task } = await prepTasks();

      return request(app)
        .put(`/v0/tasks/${task.id}/faketoken`)
        .type('json')
        .send({
          name: 'name',
          artifact: 'artifact',
          status: BuildTask.Statuses.Created,
        })
        .expect(403);
    });

    it('should return a 404 when a task isn\'t found', async () => {
      const { task } = await prepTasks();

      return request(app)
        .put(`/v0/tasks/1000/${task.token}`)
        .type('json')
        .send({
          name: 'name',
          artifact: 'artifact',
          status: BuildTask.Statuses.Created,
        })
        .expect(404);
    });

    it('should update a build task', async () => {
      const { task } = await prepTasks();
      const newTask = {
        name: 'new name',
        artifact: 'new artifact',
        status: BuildTask.Statuses.Created,
      };

      await request(app)
        .put(`/v0/tasks/${task.id}/${task.token}`)
        .type('json')
        .send(newTask)
        .expect(200);

      const dbTask = await BuildTask.findByPk(task.id);
      expect(dbTask.name).to.be.equal(newTask.name);
      expect(dbTask.artifact).to.be.equal(newTask.artifact);
      expect(dbTask.status).to.be.equal(newTask.status);
    });

    it('should not update a build task for certain statuses', async () => {
      const { task } = await prepTasks();
      await task.update({ status: BuildTask.Statuses.Error });
      const newTask = {
        name: 'new name',
        artifact: 'new artifact',
        status: BuildTask.Statuses.Processing,
      };

      await request(app)
        .put(`/v0/tasks/${task.id}/${task.token}`)
        .type('json')
        .send(newTask)
        .expect(403);

      const dbTask = await BuildTask.findByPk(task.id);
      expect(dbTask.name).to.be.equal(task.name);
      expect(dbTask.artifact).to.be.equal(task.artifact);
      expect(dbTask.status).to.be.equal(BuildTask.Statuses.Error);
    });
  });
});
