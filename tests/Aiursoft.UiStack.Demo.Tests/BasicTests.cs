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
        response.EnsureSuccessStatusCode(); // Status Code 200-299
    }

    [TestMethod]
    [DataRow("css/app.css")]
    [DataRow("js/app.js")]
    public async Task TestGetEmbeddedAssets(string path)
    {
        var response = await _http.GetAsync($"{_endpointUrl}/UIStack/dist/{path}");
        response.EnsureSuccessStatusCode();
        Assert.IsTrue((await response.Content.ReadAsByteArrayAsync()).Length > 0);
    }
}
