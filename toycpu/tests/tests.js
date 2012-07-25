// documentation on writing tests here: http://docs.jquery.com/QUnit
// example tests: https://github.com/jquery/qunit/blob/master/test/same.js

module("Basic");

test("Environment is good",function()
{
    expect(2);
    ok(VM,"VM loaded");
    ok(FONT_DATA, "Font loaded");
});

test("Not in bizzaro-world",function()
{
    expect(1);
    equal(1, 1, "OK");
});

module("Fail Example");

test("This should fail",function()
{
    expect(1);
    equal(2,3,"2 is 3");
});


