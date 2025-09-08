import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createFixtureOrg } from '../../../test/frontend/support/data/organizations';
import { randomUUID } from 'node:crypto';
import OrganizationCard from './OrganizationCard';

// Mocking react-router-dom's <Link> component
// to avoid rendering actual routing elements in tests.
// This prevents warnings  when <Link> is used outside a Router
jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original, Link: ({ to, children }) => {
      return `Link[to="${to}"] ${children}`;
    }
  };
});

describe('OrganizationCard', () => {

  function testOrganizationCard(organizationName) {
    expect(screen.getByText(organizationName)).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('usa-card');
  }

  function testMessage(isSandbox, days) {
    const m = `All data for this sandbox organization will be removed in ${days} days.`;
    const emElement = screen.queryByText(m, { selector: 'em' });
    if (isSandbox) {
      expect(emElement).toBeInTheDocument();
      expect(emElement.tagName).toBe('EM');
    } else {
      expect(emElement).not.toBeInTheDocument();
    }
  }

  function testOrganizationActiveStatus(isActive) {
    const footer = screen.queryByText('Inactive');
    if (!isActive) {
      expect(footer).toHaveClass('usa-card__footer');
    } else {
      expect(footer).not.toBeInTheDocument();
    }
  }

  function testOrganizationLink(isLink, organizationId) {
    const linkMock = 'Link[to="/organizations/' + organizationId.toString() + '"] Edit';
    if (isLink) {
      expect(screen.getByText(linkMock)).toBeInTheDocument();
    } else {
      expect(screen.queryByText(linkMock)).not.toBeInTheDocument();
    }
  }

  function initTest({ isActive, isSandbox, roleName }) {
    const testProps = {
      organization: createFixtureOrg({
        name: 'Organization Name',
        isActive: isActive,
        isSandbox: isSandbox,
        daysUntilSandboxCleaningdays: 3
      }), role: {
        id: randomUUID(), name: roleName
      }
    };
    render(<OrganizationCard {...(testProps)} />);
    return testProps;
  }

  it('renders correctly active production organization for a non-manager role', () => {

    const testData = {
      isActive: true, isSandbox: false, roleName: '!manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

  it('renders correctly active production organization for a manager role', () => {

    const testData = {
      isActive: true, isSandbox: false, roleName: 'manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(true, testProps.organization.id);
  });


  it('renders correctly active sandbox organization for a non-manager role', () => {

    const testData = {
      isActive: true, isSandbox: true, roleName: '!manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

  it('renders correctly active sandbox organization for a manager role', () => {

    const testData = {
      isActive: true, isSandbox: true, roleName: 'manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(true, testProps.organization.id);
  });

  it('renders correctly inactive production organization for a non-manager role', () => {

    const testData = {
      isActive: false, isSandbox: false, roleName: '!manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

  it('renders correctly inactive production organization for a manager role', () => {

    const testData = {
      isActive: false, isSandbox: false, roleName: 'manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

  it('renders correctly inactive sandbox organization for a non-manager role', () => {

    const testData = {
      isActive: false, isSandbox: true, roleName: '!manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

  it('renders correctly inactive sandbox organization for a manager role', () => {

    const testData = {
      isActive: false, isSandbox: true, roleName: 'manager'
    };
    const testProps = initTest(testData);

    testOrganizationCard(testProps.organization.name);
    testMessage(testData.isSandbox, testProps.organization.daysUntilSandboxCleaningdays);
    testOrganizationActiveStatus(testData.isActive);
    testOrganizationLink(false, testProps.organization.id);
  });

});

