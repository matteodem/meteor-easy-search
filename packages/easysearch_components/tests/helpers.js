TestHelpers = {
  createComponent: function(component, data) {
    var c = new component();

    c.data = function () { return data; };

    return c;
  }
};
