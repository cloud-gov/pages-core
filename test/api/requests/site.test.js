describe("Site API", () => {
  describe("GET /v0/site", () => {
    it("should require authentication")
    it("should render a list of sites associated with the user")
    it("should not render any sites not associated with the user")
  })

  describe("GET /v0/site/:id", () => {
    it("should require authentication")
    it("should redner a JSON representation of the site")
    it("should respond with a 401 if the user is not associated with the site")
  })

  describe("DELETE /v0/site/:id", () => {
    it("should require authentication")
    it("should allow a user to delete a site associated with their account")
    it("should not allow a user to delete a site not associated with their account")
  })

  describe("PUT /v0/site/:id", () => {
    it("should require authentication")
    it("should allow a user to update a site associated with their account")
    it("should not allow a user to update a site not associated with their account")
    it("should trigger a rebuild of the site")
  })

  describe("POST /v0/site/clone", () => {
    it("should require authentication")
    it("should create a new site record for the given repository")
    it("should trigger a build that pushes the source repo to the destiantion repo")
  })
})
