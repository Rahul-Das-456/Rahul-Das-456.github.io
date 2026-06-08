<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap — Rahul Das</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: "Courier New", monospace;
            background: #f8f5f0;
            color: #1c1c1e;
            padding: 3rem 4rem;
            max-width: 860px;
            margin: 0 auto;
          }
          h1 {
            font-family: Georgia, serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: #1a3a5c;
            margin-bottom: 0.4rem;
            letter-spacing: -0.01em;
          }
          .meta {
            font-size: 0.75rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #b8976a;
            margin-bottom: 2.5rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            font-size: 0.68rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #1a3a5c;
            padding: 0.75rem 1rem;
            border-bottom: 2px solid #1a3a5c;
          }
          td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid #c8bfb0;
            font-size: 0.85rem;
            vertical-align: middle;
          }
          a { color: #1a3a5c; text-decoration: none; }
          a:hover { color: #b8976a; }
          .priority { color: #b8976a; font-weight: 600; }
          .freq { color: #6e6e73; }
          .date { color: #6e6e73; }
        </style>
      </head>
      <body>
        <h1>Rahul Das — Sitemap</h1>
        <div class="meta">
          <xsl:value-of select="count(sm:urlset/sm:url)"/> URLs &#xb7; rahul-das-456.github.io
        </div>
        <table>
          <tr>
            <th>URL</th>
            <th>Last Modified</th>
            <th>Change Frequency</th>
            <th>Priority</th>
          </tr>
          <xsl:for-each select="sm:urlset/sm:url">
            <tr>
              <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
              <td class="date"><xsl:value-of select="sm:lastmod"/></td>
              <td class="freq"><xsl:value-of select="sm:changefreq"/></td>
              <td class="priority"><xsl:value-of select="sm:priority"/></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>