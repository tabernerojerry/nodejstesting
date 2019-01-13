const chai = require("chai");
const sinon = require("sinon");
const chaiAsPromised = require("chai-as-promised");
const sinonChai = require("sinon-chai");
const rewire = require("rewire");

const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(sinonChai);

const mongoose = require("mongoose");
let users = rewire("./users");
const User = require("./models/user");
const mailer = require("./mailer");

// sinon createSandbox
const sandbox = sinon.createSandbox();

describe("User", () => {
  let findStub, sampleArgs, sampleUsera, deleteStub, mailerStub;

  beforeEach(() => {
    sampleUser = {
      _id: 1,
      name: "Jerry",
      email: "jerry@test.com",
      save: sandbox.stub().resolves()
    };

    findStub = sandbox.stub(mongoose.Model, "findById").resolves(sampleUser);

    deleteStub = sandbox
      .stub(mongoose.Model, "remove")
      .resolves("fake_remove_result");

    mailerStub = sandbox
      .stub(mailer, "sendWelcomeEmail")
      .resolves("fake_email_result");
  });

  afterEach(() => {
    sandbox.restore();
    users = rewire("./users");
  });

  context("get user", () => {
    it("should check for an id", done => {
      users.get(null, (err, result) => {
        expect(err).to.exist;
        expect(err.message).to.equal("Invalid user id");

        done();
      });
    });

    it("should call findById with id and return result", done => {
      sandbox.restore();

      // null is the error
      let stub = sandbox
        .stub(mongoose.Model, "findById")
        .yields(null, { name: "Jerry" });

      users.get(1, (err, result) => {
        expect(err).to.not.exist;
        expect(stub).to.have.been.calledOnce;
        expect(stub).to.have.been.calledWith(1);
        expect(result).to.be.a("object");
        expect(result)
          .to.have.property("name")
          .to.equal("Jerry");
      });

      done();
    });

    it("should catch error if there is one", done => {
      sandbox.restore();

      let stub = sandbox
        .stub(mongoose.Model, "findById")
        .yields(new Error("fake")); // Message error is fake

      users.get(1, (err, result) => {
        expect(result).to.not.exist;
        expect(err).to.exist;
        expect(err).to.instanceOf(Error);
        expect(stub).to.have.been.calledWith(1);
        expect(err.message).to.equal("fake");
      });

      done();
    });
  });

  context("delete user", () => {
    it("should check for an id using return", () => {
      return users
        .delete()
        .then(result => {
          throw new Error("Unexpected Error");
        })
        .catch(err => {
          expect(err).to.instanceOf(Error);
          expect(err.message).to.equal("Invalid id");
        });
    });

    it("should check for error using eventually", () => {
      expect(users.delete()).to.eventually.rejectedWith("Invalid id");
    });

    it("should call User.remove", async () => {
      let result = await users.delete(1);

      expect(result).to.equal("fake_remove_result");
      expect(deleteStub).to.have.been.calledWith({ _id: 1 });
    });
  });

  context("create user", () => {
    let FakeUserClass, saveStub, result;

    beforeEach(async () => {
      saveStub = sandbox.stub().resolves(sampleUser);

      // save is the save method in the users.save()
      FakeUserClass = sandbox.stub().returns({ save: saveStub });

      users.__set__("User", FakeUserClass);

      result = await users.create(sampleUser);
    });

    it("should reject invalid arguments", async () => {
      await expect(users.create()).to.eventually.rejectedWith(
        "Invalid arguments"
      );
      await expect(users.create({ name: "foo" })).to.eventually.rejectedWith(
        "Invalid arguments"
      );
      await expect(
        users.create({ email: "foo@email.com" })
      ).to.eventually.rejectedWith("Invalid arguments");
    });

    it("should call user with new", () => {
      expect(FakeUserClass).to.have.been.calledWithNew;
      expect(FakeUserClass).to.have.been.calledWith(sampleUser);
    });

    it("should save the user users.save()", () => {
      expect(saveStub).to.have.been.called;
    });

    it("should call mailer with email and name", () => {
      expect(mailerStub).to.have.been.calledWith(
        sampleUser.email,
        sampleUser.name
      );
    });

    it("should reject errors", async () => {
      saveStub.rejects(new Error("fake"));

      await expect(users.create(sampleUser)).to.eventually.rejectedWith("fake");
    });
  });

  context("update user", () => {
    it("should find by user id", async () => {
      await users.update(1, { age: 35 });

      expect(findStub).to.have.been.calledWith(1);
    });

    it("should call save.user()", async () => {
      await users.update(1, { age: 20 });

      expect(sampleUser.save).to.have.been.calledOnce;
    });

    it("should reject if there is an error", async () => {
      findStub.throws(new Error("fake err"));

      await expect(users.update(1, { age: 20 })).to.eventually.be.rejectedWith(
        "fake err"
      );
    });
  });

  context("reset password", () => {
    let resetStub;

    beforeEach(() => {
      resetStub = sandbox
        .stub(mailer, "sendPasswordResetEmail")
        .resolves("reset");
    });

    it("should check for email", async () => {
      await expect(users.resetPassword()).to.eventually.be.rejectedWith(
        "Invalid email"
      );
    });

    it("should call sendPasswordResetEmail", async () => {
      await users.resetPassword("jerry@test.com");

      expect(resetStub).to.have.been.calledWith("jerry@test.com");
    });
  });
});
