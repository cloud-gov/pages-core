import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationBar from './LocationBar';

describe('LocationBar Component', () => {
  const mockOnNavigate = jest.fn();
  const storageRoot = 'https://example.gov/~assets';
  const siteId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders root directory correctly, in text (not link) if current directory', () => {
    render(
      /* MemoryRouter allows us to render components that use react Link  */
      <LocationBar
        path=""
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByText(`${storageRoot}/`)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: `${storageRoot}/` }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('../')).not.toBeInTheDocument();
  });

  it('renders single-level folder correctly, with parent as link', () => {
    render(
      <LocationBar
        path="foo"
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByRole('link', { name: `${storageRoot}/` })).toBeInTheDocument();
    expect(screen.getByText('foo/')).toBeInTheDocument();
  });

  it('renders nested folders with ../ link', () => {
    render(
      <LocationBar
        path="foo/bar"
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByRole('link', { name: '../' })).toBeInTheDocument();
    expect(screen.getByText('bar/')).toBeInTheDocument();
  });

  it('clicking a breadcrumb calls on parent and grandparent path', () => {
    render(
      <LocationBar
        path="baz/foo/bar"
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('link', { name: '../' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('baz/');

    fireEvent.click(screen.getByRole('link', { name: 'foo/' }));
    expect(mockOnNavigate).toHaveBeenCalledWith('baz/foo/');
  });

  it('renders deep nested path correctly', () => {
    render(
      <LocationBar
        path="foo/bar/baz"
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.getByRole('link', { name: '../' })).toBeInTheDocument();
    expect(screen.getByText('baz/')).toBeInTheDocument();
  });

  it('does not render ../ at root level', () => {
    render(
      <LocationBar
        path=""
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    expect(screen.queryByRole('link', { name: '../' })).not.toBeInTheDocument();
  });

  it('clicking domain/~assets resets to root if it is a link', () => {
    render(
      <LocationBar
        path="foo"
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: `${storageRoot}/` }));
    expect(mockOnNavigate).toHaveBeenCalledWith('/');
  });

  it('removes the trailing slash in deep nested node', () => {
    const fileName = 'qux.txt';
    const path = `foo/bar/bash/${fileName}`;
    render(
      <LocationBar
        path={path}
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
        trailingSlash={false}
      />,
    );

    const span = screen.getByTitle(fileName);
    expect(span.textContent).toEqual(fileName);
  });

  it('removes the trailing slash in root', () => {
    const fileName = 'qux.txt';
    const path = `/${fileName}`;
    render(
      <LocationBar
        path={path}
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
        trailingSlash={false}
      />,
    );

    const span = screen.getByTitle(fileName);
    expect(span.textContent).toEqual(fileName);
  });

  it('appends the trailing slash by default', () => {
    const fileName = 'qux.txt';
    const path = `foo/bar/bash/${fileName}`;
    render(
      <LocationBar
        path={path}
        siteId={siteId}
        storageRoot={storageRoot}
        onNavigate={mockOnNavigate}
      />,
    );

    const elementName = `${fileName}/`;
    const span = screen.getByTitle(elementName);
    expect(span.textContent).toEqual(elementName);
  });
});
