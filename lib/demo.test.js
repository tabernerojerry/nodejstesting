const chai = require("chai");
const chaiAsPromise = require("chai-as-promised");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const rewire = require("rewire");

const expect = chai.expect;

// chai as promised plugins
chai.use(chaiAsPromise);

chai.use(sinonChai);

const demo = rewire("./demo");

describe("Demo Test", () => {
  context("Add", () => {
    it("should add two number", () => {
      expect(demo.add(1, 2)).to.equal(3);
    });
  });

  context("Callback Add", () => {
    it("should test the callback", done => {
      expect(
        demo.addCallback(1, 2, (err, result) => {
          expect(err).not.to.exist;
          expect(result).to.equal(3);
          done();
        })
      );
    });
  });

  context("Test Promise ", () => {
    it("shoud add with a promise cb", done => {
      demo
        .addPromise(1, 2)
        .then(result => {
          expect(result).to.equal(3);
          done();
        })
        .catch(err => {
          console.log("Test Promise Error");
          done(err);
        });
    });

    it("should test a promise with return", done => {
      demo.addPromise(1, 2).then(result => {
        expect(result).to.equal(3);
        done();
      });
    });

    it("should test promise with async await", async () => {
      const result = await demo.addPromise(1, 2);

      expect(result).to.equal(3);
    });

    it("should test promise with chai as promise", async () => {
      await expect(demo.addPromise(1, 2)).to.eventually.equal(3);
    });
  });

  context("test doubles", () => {
    it("should spy on log", () => {
      let spy = sinon.spy(console, "log");

      demo.foo();

      expect(spy.calledOnce).to.be.true;

      // sinon chai plugin
      expect(spy).to.have.been.calledOnce;

      // should call spy restore after the spy test to avoid any issue
      spy.restore();
    });

    it("should stub console.warn", () => {
      let stub = sinon
        .stub(console, "warn")
        .callsFake(() => console.log("message from stub"));

      demo.foo();

      expect(stub).to.have.been.calledOnce;

      expect(stub).to.have.been.calledWith("console.warn was called");

      // should call stub restore after the spy test to avoid any issue
      stub.restore();
    });
  });

  context("stub private function", () => {
    it("should stub createFile", async () => {
      let createStub = sinon.stub(demo, "createFile").resolves("create_stub");
      let callStub = sinon.stub().resolves("calldb_stub");

      demo.__set__("callDB", callStub);

      let result = await demo.bar("test.txt");

      expect(result).to.equal("calldb_stub");
      expect(createStub).to.have.been.calledOnce;
      expect(createStub).to.have.been.calledWith("test.txt");
      expect(callStub).to.have.been.calledOnce;

      createStub.restore();
      callStub.restore;
    });
  });
});
