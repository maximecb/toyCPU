// documentation on writing tests here: http://docs.jquery.com/QUnit
// example tests: https://github.com/jquery/qunit/blob/master/test/same.js

module("Basic");

// these test things from plugins.js
test("Environment is good",function()
{
    expect(2);
    ok(VM,"VM loaded");
    ok(FONT_DATA, "Font loaded");
});

module("Fail Example");

// these test things from plugins.js
test("This should fail",function()
{
    expect(1);
    equal(2,3,"2 is 3");
});


