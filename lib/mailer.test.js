const chai = require("chai");
const sinon = require("sinon");
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const rewire = require("rewire");

const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

let mailer = rewire("./mailer");

// sinon createSandbox
const sandbox = sinon.createSandbox();

describe("Mailer", () => {
  let emailStub;

  beforeEach(() => {
    emailStub = sandbox.stub().resolves("done");

    mailer.__set__("sendEmail", emailStub);
  });

  afterEach(() => {
    sandbox.restore();
    mailer = rewire("./mailer");
  });

  context("sendWelcomeEmail", () => {
    it("should check for email and name", async () => {
      await expect(mailer.sendWelcomeEmail()).to.eventually.be.rejectedWith(
        "Invalid input"
      );

      await expect(
        mailer.sendWelcomeEmail("foo@test.com")
      ).to.eventually.be.rejectedWith("Invalid input");
    });

    it("should call sendEmail with email and message", async () => {
      await mailer.sendWelcomeEmail("foo@test.com", "foo");

      expect(emailStub).to.have.been.calledWith(
        "foo@test.com",
        "Dear foo, welcome to our family!"
      );
    });
  });

  context("sendPasswordResetEmail", () => {
    it("should check for email", async () => {
      await expect(
        mailer.sendPasswordResetEmail()
      ).to.eventually.be.rejectedWith("Invalid input");
    });

    it("should call sendEmail with email and message", async () => {
      await mailer.sendPasswordResetEmail("foo@test.com");

      expect(emailStub).to.have.been.calledWith(
        "foo@test.com",
        "Please click http://some_link to reset your password."
      );
    });
  });

  // Private function
  context("sendEmail", () => {
    let sendEmail;

    beforeEach(() => {
      mailer = rewire("./mailer");
      sendEmail = mailer.__get__("sendEmail");
    });

    it("should check for email and body", async () => {
      await expect(sendEmail()).to.eventually.be.rejectedWith("Invalid input");
      await expect(sendEmail("foo@test.com")).to.eventually.be.rejectedWith(
        "Invalid input"
      );
    });

    it("should call sendEmail with email and message", async () => {
      // stub actual mailer

      let result = await sendEmail("foo@test.com", "Welcome");

      expect(result).to.equal("Email sent");
    });
  });
});
