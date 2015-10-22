import React from 'react';
import { RouteHandler, Link, State } from 'react-router';
import { Container, Grid, Breakpoint, Span } from 'react-responsive-grid';
import colorPairsPicker from 'color-pairs-picker';
import chroma from 'chroma-js';
import includes from 'underscore.string/include';
import { link } from 'gatsby-helpers';

import typography from 'utils/typography';

// Style code
import 'css/app.css';
import 'css/github.css';

const { rhythm, fontSizeToPx } = typography;

module.exports = React.createClass({
  mixins: [State],
  render: function() {
    var activeHeaderColors, darker, docsActive, examplesActive, headerColors, ref1, ref2, routes, urlPrefix;
    headerColors = colorPairsPicker(this.props.config.headerColor, {
      contrast: 5.5
    });
    darker = chroma(this.props.config.headerColor).darken(9).hex();
    activeHeaderColors = colorPairsPicker(darker, {
      contrast: 7
    });
    if (__GH_PAGES__) {
      urlPrefix = this.props.config.ghPagesURLPrefix;
    } else {
      urlPrefix = this.props.config.ghPagesURLPrefix;
    }
    routes = this.getRoutes().map(function(route) {
      return route.path;
    });
    docsActive = (routes.indexOf(urlPrefix + "/docs/") >= 0);

    return (
      <div>
        <div
          style={{
            background: headerColors.bg,
            color: headerColors.fg,
            marginBottom: rhythm(1.5)
          }}
        >
          <Container
            style={{
              maxWidth: 1000,
              padding: `${rhythm(1/2)}`,
              paddingBottom: `${rhythm(1/2)}`
            }}
          >
            <Grid
              columns={12}
              style={{
                padding: `${rhythm(1/2)} 0`
              }}
            >
              <Span
                columns={4}
                style={{
                  height: 24 // Ugly hack. How better to constrain height of div?
                }}
              >
                <Link
                  to={`${urlPrefix}/`}
                  style={{
                    textDecoration: 'none',
                    color: headerColors.fg,
                    fontSize: fontSizeToPx("25.5px").fontSize
                  }}
                >
                  {this.props.config.siteTitle}
                </Link>
              </Span>
              <Span columns={8} last={true}>
                <a
                  style={{
                    float: 'right',
                    color: headerColors.fg,
                    textDecoration: 'none',
                    marginLeft: rhythm(1/2)
                  }}
                  href="https://github.com/matteodem/meteor-easy-search"
                >
                  Github
                </a>
                <Link
                  to={`${urlPrefix}/docs/`}
                  style={{
                    background: docsActive ? activeHeaderColors.bg : headerColors.bg,
                    color: docsActive ? activeHeaderColors.fg : headerColors.fg,
                    float: 'right',
                    textDecoration: 'none',
                    paddingLeft: rhythm(1/2),
                    paddingRight: rhythm(1/2),
                    paddingBottom: rhythm(1),
                    marginBottom: rhythm(-1),
                    paddingTop: rhythm(1),
                    marginTop: rhythm(-1)
                  }}
                >
                  Documentation
                </Link>
              </Span>
            </Grid>
          </Container>
        </div>
        <Container
          style={{
            maxWidth: 1000,
            padding: `${rhythm(1)} ${rhythm(1/2)}`,
            paddingTop: 0
          }}
        >
          <RouteHandler typography={typography} {...this.props}/>
        </Container>
      </div>
    );
  }
});
