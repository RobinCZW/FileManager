'use strict';
class ICollege {
  static nyi() {
    throw new Error("Not yet implemented");
  }
  get Name() { ICollege.nyi(); }
  get ID() { ICollege.nyi(); }
  login(sid, password, params) { ICollege.nyi(); }
};
ICollege.WrongCaptcha = class WrongCaptcha extends Error {
  
}
module.exports = ICollege;