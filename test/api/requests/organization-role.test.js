describe('Organization Role API', () => {
  describe('GET /v0/organization-role', () => {
    it('requires authentication');

    it('returns the current users organization roles');
  });

  describe('DELETE /v0/organization-role', () => {
    it('requires authentication');

    it('returns a 404 if the user is not a manager of the organization');

    it('deletes the organization role');

    it('returns an empty object');
  });

  describe('PUT /v0/organization-role', () => {
    it('requires authentication');

    it('returns a 404 if the user is not a manager of the organization');

    it('returns an error if the organization role cannot be updated');

    it('updates the organization role and returns the new value');
  });
});
