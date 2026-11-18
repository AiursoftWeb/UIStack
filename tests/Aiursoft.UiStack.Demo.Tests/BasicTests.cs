using Aiursoft.CSTools.Tools;
using Microsoft.Extensions.Hosting;
using static Aiursoft.WebTools.Extends;

[assembly:DoNotParallelize]

namespace Aiursoft.UiStack.Demo.Tests;

[TestClass]
public class BasicTests
{
    private readonly string _endpointUrl;
    private readonly int _port;
    private readonly HttpClient _http;
    private IHost? _server;

    public BasicTests()
    {
        _port = Network.GetAvailablePort();
        _endpointUrl = $"http://localhost:{_port}";
        _http = new HttpClient();
    }

    [TestInitialize]
    public async Task CreateServer()
    {
        _server = await AppAsync<Startup>([], port: _port);
        await _server.StartAsync();
    }

    [TestCleanup]
    public async Task CleanServer()
    {
        if (_server == null) return;
        await _server.StopAsync();
        _server.Dispose();
    }

    [TestMethod]
    public async Task TestGetHome()
    {
        var response = await _http.GetAsync(_endpointUrl);
        response.EnsureSuccessStatusCode();
        var html = await response.Content.ReadAsStringAsync();
        StringAssert.Contains(html, "/node_modules/@aiursoft/uistack/dist/css/app.css");
        StringAssert.Contains(html, "/node_modules/@aiursoft/uistack/dist/js/app.js");
    }

    [TestMethod]
    [DataRow("css/app.css")]
    [DataRow("js/app.js")]
    [DataRow("fonts/poppins-latin-400-normal.woff2")]
    [DataRow("img/flags/cn.png")]
    public async Task TestGetApplicationAssets(string path)
    {
        var response = await _http.GetAsync($"{_endpointUrl}/node_modules/@aiursoft/uistack/dist/{path}");
        response.EnsureSuccessStatusCode();
        Assert.IsTrue((await response.Content.ReadAsByteArrayAsync()).Length > 0);
    }
}
