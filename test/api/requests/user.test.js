describe("User API", () => {
  describe("GET /v0/user", () => {
    it("should require authentication")
    it("should redirect to GET /v0/user/:id for the current user")
  })

  describe("GET /v0/user/:id", () => {
    it("should require authentication")
    it("should show a JSON representation of the current user if the id matches theirs")
    it("should respond with a 403 if the requested user does not match the current user")
  })

  describe("POST /v0/user/add-site", () => {
    it("should require authentication")
    it("should create a new site for a remote repository")
    it("should add a user to a site if a site already exists for the remote repository")
    it("should respond with a 400 if no owner or repo is specified")
    it("should render a 400 if the user does not have write access to the repository")
  })
})
